# Plant Disease Detector 🌿

Krishi Madad is a smart agriculture assistance platform designed to help farmers make informed decisions through AI-powered plant disease detection, real-time weather forecasting, agriculture-focused news updates, and voice-enabled multilingual interaction.

The platform combines Machine Learning, Web APIs, and modern web technologies to improve accessibility and provide timely agricultural insights

## Features

- 🤖 **AI-Powered Detection**: Uses your fine-tuned Keras model to detect plant diseases with confidence scores and recommendations
- 🌍 **Multilingual**: Support users in English, Hindi, Tamil, and 10 other major regional tongues.
- 🌤️ **Weather Updates**: Localized weather updatesand 7 days forecasts
- ⚡ **News Alerts**:  Filtered news updates relevant to agriculture and
government schemes
- 🗣 **Voice-Enabled Assistant**:Supports voice input and audio responses for improved accessibility



## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the Flask server:
```bash
python app.py
```

The API will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 📊 Model Performance

| Metric | Score |
|----------|----------|
| Accuracy | 87.85% |
| Precision | 88.84% |
| Recall | 88.34% |
| F1-Score | 88.31% |
| Top-5 Accuracy | 99.13% |

## Usage

1. **Start the Backend**: Run `python app.py` in the backend directory
2. **Start the Frontend**: Run `npm run dev` in the frontend directory
3. **Upload Image**: Click on the upload area or drag and drop a plant image
4. **View Results**: Get instant disease detection with recommendations
5. **Change Language**: Use the language selector to switch between English, Hindi, and Tamil
6. **Weather Updates**: get location based weather updates and weekly forecasts
7.  **News Alerts**: get in touch with updates relevant to agriculture and
government schemes

## Supported Disease Classes

The model currently supports:
Plant Types: {'Orange', 'Pepper,_bell', 'Tomato', 'Corn_(maize)', 'Squash', 'Soybean', 'Potato', 'Grape', 'Strawberry', 'Cherry_(including_sour)', 'Peach', 'Blueberry', 'Raspberry', 'Apple'}

## Technologies Used

### Backend
- Flask - Web framework
- TensorFlow/Keras - Deep learning
- Pillow - Image processing
- Flask-CORS - Cross-origin support

### Frontend
- React - UI framework
- Vite - Build tool
- Tailwind CSS - Styling
- Lucide React - Icons
