import json
import base64
import io
import os
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf

app = Flask(__name__)
CORS(app)

#  Get absolute path of current file (backend folder)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Correct paths
MODEL_PATH = os.path.join(BASE_DIR, "plant_disease_prediction_model.keras")
CLASS_PATH = os.path.join(BASE_DIR, "class_indices.json")

#  Load model and class indices safely
model = tf.keras.models.load_model(MODEL_PATH)

with open(CLASS_PATH, "r") as f:
    class_indices = json.load(f)

# Human-readable disease name formatter
def format_class_name(raw_name):
    parts = raw_name.split("___")
    plant = parts[0].replace("_", " ")
    condition = parts[1].replace("_", " ") if len(parts) > 1 else "Unknown"
    return plant, condition


# -----------------------------------------------------------------------
# Comprehensive recommendations keyed by the EXACT disease token that
# appears after "___" in the class-index labels (spaces converted from
# underscores for display, but matching is done case-insensitively).
# -----------------------------------------------------------------------
RECOMMENDATIONS = {
    # ── Healthy ──────────────────────────────────────────────────────────
    "healthy": [
        "Continue regular watering and feeding",
        "Monitor weekly for any early signs of disease or pests",
        "Maintain good airflow by pruning overcrowded growth",
    ],

    # ── Apple ────────────────────────────────────────────────────────────
    "Apple scab": [
        "Apply fungicides (captan or myclobutanil) starting at bud-break",
        "Rake and destroy fallen leaves to break the disease cycle",
        "Choose scab-resistant apple varieties for future planting",
        "Prune to improve canopy airflow and reduce humidity",
    ],
    "Black rot": [
        "Remove and destroy mummified fruits and cankered branches",
        "Apply captan or thiophanate-methyl fungicide at petal fall",
        "Avoid wounding bark — entry wounds invite infection",
        "Ensure good drainage around the root zone",
    ],
    "Cedar apple rust": [
        "Remove nearby cedar/juniper trees that host the alternate stage",
        "Apply myclobutanil or propiconazole at the pink bud stage",
        "Choose rust-resistant apple cultivars for new plantings",
    ],

    # ── Blueberry ────────────────────────────────────────────────────────
    "Blueberry healthy": [
        "Maintain soil pH between 4.5–5.5 for optimal nutrient uptake",
        "Mulch with pine bark to conserve moisture and suppress weeds",
        "Inspect for mummy berry and stem blight each spring",
    ],

    # ── Cherry ───────────────────────────────────────────────────────────
    "Powdery mildew": [
        "Apply sulfur-based or potassium bicarbonate fungicide at first sign",
        "Avoid overhead irrigation — water at the base",
        "Prune shoots showing white powdery coating immediately",
        "Improve air circulation by thinning the canopy",
    ],
    "Cherry healthy": [
        "Monitor for brown rot and leaf spot during warm, wet periods",
        "Apply dormant oil spray before buds swell to control scale insects",
    ],

    # ── Corn (Maize) ─────────────────────────────────────────────────────
    "Cercospora leaf spot Gray leaf spot": [
        "Rotate corn with non-host crops (soybean, wheat) for at least 1 year",
        "Apply strobilurin or triazole fungicides at tasseling stage",
        "Bury or till under crop debris after harvest",
        "Choose gray-leaf-spot-resistant hybrids",
    ],
    "Common rust": [
        "Plant rust-resistant corn hybrids",
        "Apply fungicide (azoxystrobin) if disease appears before silking",
        "Scout fields regularly after warm, humid nights",
    ],
    "Northern Leaf Blight": [
        "Use resistant hybrids (Ht1, Ht2, or HtN genes)",
        "Apply fungicide at early tasseling when lesions first appear",
        "Rotate away from corn for at least one season",
        "Till or disk stalks after harvest to reduce inoculum",
    ],
    "Corn maize healthy": [
        "Test soil annually and adjust nitrogen applications accordingly",
        "Scout for tar spot and gray leaf spot starting at V6 stage",
    ],

    # ── Grape ────────────────────────────────────────────────────────────
    "Black rot": [  # duplicate key intentional — used as fallback string match
        "Remove and destroy mummified berries and diseased canes",
        "Apply mancozeb or myclobutanil starting at bud swell",
        "Maintain an open canopy to promote rapid drying",
    ],
    "Esca Black Measles": [
        "Prune during dry weather and seal large wounds with wound protectant",
        "Remove and destroy wood showing internal brown streaking",
        "Avoid water stress — irrigate consistently",
        "There is no chemical cure; focus on prevention and vineyard hygiene",
    ],
    "Leaf blight Isariopsis Leaf Spot": [
        "Apply copper-based fungicide at bud break and after rain events",
        "Remove and burn infected leaves promptly",
        "Improve row orientation for better air drainage",
    ],
    "Grape healthy": [
        "Monitor for powdery and downy mildew during humid periods",
        "Train vines to maintain an open, airy canopy",
    ],

    # ── Orange ───────────────────────────────────────────────────────────
    "Haunglongbing Citrus greening": [
        "Remove and destroy infected trees immediately — there is no cure",
        "Control Asian citrus psyllid vectors with imidacloprid or foliar sprays",
        "Use certified disease-free nursery stock for replanting",
        "Inspect new plantings every 3 months and report suspect trees to authorities",
    ],

    # ── Peach ────────────────────────────────────────────────────────────
    "Bacterial spot": [
        "Apply copper hydroxide or oxytetracycline sprays starting at bud swell",
        "Choose bacterial-spot-tolerant peach or nectarine varieties",
        "Avoid overhead irrigation and prune for good canopy airflow",
        "Disinfect pruning tools between trees with 70% alcohol",
    ],
    "Peach healthy": [
        "Apply dormant copper spray to prevent leaf curl and bacterial spot",
        "Thin fruit early to improve size and reduce limb breakage",
    ],

    # ── Pepper (Bell) ────────────────────────────────────────────────────
    "Pepper bell Bacterial spot": [
        "Use certified disease-free seed and transplants",
        "Apply copper bactericide every 7–10 days during wet weather",
        "Rotate peppers away from tomatoes and solanaceous crops for 2 years",
        "Remove and compost infected plant debris after harvest",
    ],
    "Pepper bell healthy": [
        "Maintain consistent soil moisture to prevent blossom-end rot",
        "Scout weekly for aphids and thrips which spread bacterial diseases",
    ],

    # ── Potato ───────────────────────────────────────────────────────────
    "Early blight": [
        "Apply mancozeb or chlorothalonil fungicide every 7–10 days",
        "Ensure proper plant spacing for airflow",
        "Remove lower infected leaves promptly",
        "Avoid wetting foliage when irrigating",
    ],
    "Late blight": [
        "Apply copper-based or systemic fungicide (metalaxyl) immediately",
        "Remove and bag infected leaves — do not compost them",
        "Avoid overhead watering; irrigate at the base in the morning",
        "Destroy volunteer potato plants which harbor the pathogen",
    ],
    "Potato healthy": [
        "Hill soil around stems to prevent greening of tubers",
        "Monitor for Colorado potato beetle throughout the season",
    ],

    # ── Raspberry ────────────────────────────────────────────────────────
    "Raspberry healthy": [
        "Prune out floricanes after harvest to reduce disease pressure",
        "Apply lime-sulfur dormant spray before growth resumes in spring",
    ],

    # ── Soybean ──────────────────────────────────────────────────────────
    "Soybean healthy": [
        "Scout for sudden death syndrome and soybean cyst nematode at pod fill",
        "Rotate with non-legume crops to manage root pathogens",
    ],

    # ── Squash ───────────────────────────────────────────────────────────
    "Squash Powdery mildew": [
        "Apply potassium bicarbonate or neem oil at first sign of white patches",
        "Water in the morning so foliage dries before nightfall",
        "Remove heavily infected leaves to slow spread",
        "Plant mildew-resistant squash varieties next season",
    ],

    # ── Strawberry ───────────────────────────────────────────────────────
    "Leaf scorch": [
        "Remove and destroy infected leaves and runners",
        "Apply captan fungicide during bloom and after harvest",
        "Avoid dense planting — maintain 30–45 cm between plants",
        "Renovate beds after fruiting to reduce inoculum",
    ],
    "Strawberry healthy": [
        "Mulch with straw to keep fruit off soil and retain moisture",
        "Replace plants every 3–4 years to maintain productivity",
    ],

    # ── Tomato ───────────────────────────────────────────────────────────
    "Bacterial spot": [  # also covers tomato bacterial spot via string match
        "Use copper bactericide sprays every 5–7 days in wet weather",
        "Avoid working among wet plants to limit mechanical spread",
        "Use certified disease-free transplants",
        "Rotate tomatoes with non-solanaceous crops for 2 years",
    ],
    "Early blight": [  # duplicate handled by string match
        "Apply mancozeb or chlorothalonil fungicide every 7–10 days",
        "Remove lower leaves showing concentric-ring lesions",
        "Stake or cage plants to keep foliage off the ground",
        "Mulch the soil surface to reduce spore splash",
    ],
    "Late blight": [  # duplicate handled by string match
        "Apply metalaxyl + mancozeb (Ridomil Gold) immediately",
        "Remove and bag infected plant parts — do NOT compost",
        "Avoid overhead irrigation; water at the base in the morning",
        "Alert neighboring growers — late blight spreads rapidly by wind",
    ],
    "Leaf mold": [
        "Improve greenhouse or tunnel ventilation to reduce humidity",
        "Apply chlorothalonil or copper fungicide preventively",
        "Remove and destroy affected leaves promptly",
        "Reduce leaf wetness by spacing plants and pruning laterals",
    ],
    "Septoria leaf spot": [
        "Apply fungicide (mancozeb, chlorothalonil) at first symptom",
        "Remove lower infected leaves and dispose away from the garden",
        "Avoid overhead irrigation and working among wet foliage",
        "Rotate tomatoes away from that bed for at least 2 years",
    ],
    "Spider mites Two spotted spider mite": [
        "Spray with insecticidal soap or neem oil, covering leaf undersides",
        "Introduce predatory mites (Phytoseiulus persimilis) for biocontrol",
        "Keep plants well-watered — drought stress worsens mite outbreaks",
        "Avoid broad-spectrum insecticides that kill natural predators",
    ],
    "Target spot": [
        "Apply strobilurin or triazole fungicide at first appearance",
        "Improve air circulation by pruning excess foliage",
        "Rotate with non-solanaceous crops and bury crop debris after harvest",
    ],
    "Tomato Yellow Leaf Curl Virus": [
        "Control whitefly vectors with reflective mulch and yellow sticky traps",
        "Apply imidacloprid or spirotetramat to reduce whitefly populations",
        "Remove and destroy infected plants immediately to limit spread",
        "Use virus-resistant tomato varieties (TYLCV-resistant cultivars)",
    ],
    "Tomato mosaic virus": [
        "Remove and destroy infected plants immediately",
        "Wash hands and disinfect tools between plants with 10% bleach",
        "Control aphid and whitefly vectors with neem oil or insecticidal soap",
        "Use certified virus-free seed and resistant cultivars next season",
    ],
    "Tomato healthy": [
        "Stake or cage plants early to keep foliage off the ground",
        "Maintain consistent watering to prevent blossom-end rot and cracking",
        "Scout weekly for early signs of blight, leaf curl, or mites",
    ],

    # ── Fallback ─────────────────────────────────────────────────────────
    "default": [
        "Consult a local agronomist or plant pathology extension service",
        "Isolate affected plants to prevent spread to healthy ones",
        "Avoid overwatering and improve drainage around the root zone",
        "Collect a sample and submit to your nearest diagnostic laboratory",
    ],
}


def get_recommendations(disease_name: str) -> list[str]:
    """
    Match disease_name (the human-readable condition string, e.g.
    'Haunglongbing (Citrus greening)') against RECOMMENDATIONS keys.
    Tries progressively looser matches before falling back to 'default'.
    """
    # 1. Exact match (case-insensitive)
    for key, recs in RECOMMENDATIONS.items():
        if key.lower() == disease_name.lower():
            return recs

    # 2. Key is a substring of disease_name (or vice-versa)
    dn_lower = disease_name.lower()
    for key, recs in RECOMMENDATIONS.items():
        k_lower = key.lower()
        if k_lower in dn_lower or dn_lower in k_lower:
            return recs

    # 3. Any single word from the key appears in disease_name
    for key, recs in RECOMMENDATIONS.items():
        for word in key.lower().split():
            if len(word) > 4 and word in dn_lower:   # skip short words
                return recs

    return RECOMMENDATIONS["default"]


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        image_data = data["image"]  # base64 string like "data:image/jpeg;base64,..."

        # Strip the header (data:image/...;base64,)
        if "," in image_data:
            image_data = image_data.split(",")[1]

        # Decode and preprocess
        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img).astype("float32") / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        # Predict
        predictions = model.predict(img_array)
        predicted_index = int(np.argmax(predictions, axis=1)[0])
        confidence = float(np.max(predictions)) * 100
        raw_class = class_indices[str(predicted_index)]

        plant, condition = format_class_name(raw_class)
        is_healthy = "healthy" in condition.lower()

        return jsonify({
            "status": "healthy" if is_healthy else "diseased",
            "disease": raw_class,
            "disease_readable": f"{plant} — {condition}",
            "confidence": round(confidence, 1),
            "recommendations": get_recommendations(condition),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
