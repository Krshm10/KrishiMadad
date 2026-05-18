# Plant Disease Detector 🌿

A full-stack AI-powered plant disease detection application with a beautiful, multilingual UI.

## Features

- 🤖 **AI-Powered Detection**: Uses your fine-tuned Keras model to detect plant diseases
- 🎨 **Beautiful UI**: Modern, responsive design inspired by AgriCare
- 🌍 **Multilingual**: Supports English, Hindi, and Tamil
- 📱 **Mobile Responsive**: Works seamlessly on all devices
- 🌤️ **Weather Integration**: Displays weather forecasts for farmers
- ⚡ **Real-time Results**: Instant disease detection with confidence scores

## Project Structure

```
plant-disease-predictor/
├── backend/                  # Flask API server
│   ├── app.py               # Main API application
│   ├── fine_tuned_model.keras  # Your trained model
│   └── requirements.txt     # Python dependencies
├── frontend/                # React application
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Styles
│   ├── package.json        # Node dependencies
│   └── index.html          # HTML template
└── README.md               # This file
```

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

## Usage

1. **Start the Backend**: Run `python app.py` in the backend directory
2. **Start the Frontend**: Run `npm run dev` in the frontend directory
3. **Upload Image**: Click on the upload area or drag and drop a plant image
4. **View Results**: Get instant disease detection with recommendations
5. **Change Language**: Use the language selector to switch between English, Hindi, and Tamil

## API Endpoints

### `GET /health`
Check if the API is running and model is loaded.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### `POST /predict`
Predict disease from plant image.

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "disease": "Potato Late Blight",
  "confidence": 94.5,
  "status": "diseased",
  "recommendations": [
    "Remove infected leaves immediately",
    "Apply copper-based fungicide",
    "Improve air circulation"
  ]
}
```

### `GET /classes`
Get all supported disease classes.

## Customization

### Adding Disease Classes

Edit `DISEASE_CLASSES` in `backend/app.py`:
```python
DISEASE_CLASSES = [
    'Your Disease 1',
    'Your Disease 2',
    # ... add more
]
```

### Adding Recommendations

Edit `RECOMMENDATIONS` in `backend/app.py`:
```python
RECOMMENDATIONS = {
    'Your Disease': [
        'Recommendation 1',
        'Recommendation 2',
        # ... add more
    ]
}
```

### Model Input Size

If your model uses a different input size than 224x224, update the resize in `backend/app.py`:
```python
image = image.resize((YOUR_SIZE, YOUR_SIZE))
```

## Supported Disease Classes

The model currently supports:
- Apple diseases (Scab, Black Rot, Cedar Rust)
- Corn diseases (Common Rust, Gray Leaf Spot)
- Grape diseases (Black Rot, Esca)
- Potato diseases (Early Blight, Late Blight)
- Tomato diseases (multiple varieties)
- Healthy plant detection

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

## Troubleshooting

### Backend Issues

**Model not loading:**
- Ensure `fine_tuned_model.keras` is in the backend directory
- Check TensorFlow version compatibility

**CORS errors:**
- Verify Flask-CORS is installed
- Check the API_URL in frontend matches backend address

### Frontend Issues

**API connection failed:**
- Ensure backend is running on port 5000
- Check browser console for errors
- Verify network settings

**Image upload not working:**
- Check file size (keep under 10MB)
- Ensure image format is supported (JPEG, PNG)

## Performance Optimization

1. **Backend**:
   - Use production WSGI server (gunicorn) instead of Flask dev server
   - Implement caching for model predictions
   - Add request rate limiting

2. **Frontend**:
   - Run `npm run build` for production build
   - Serve with nginx or similar
   - Enable compression

## Future Enhancements

- [ ] Add image preprocessing options
- [ ] Support batch image uploads
- [ ] Save prediction history
- [ ] Add data visualization
- [ ] Implement user accounts
- [ ] Add offline mode (PWA)
- [ ] Integrate real weather API
- [ ] Add crop news feed

## License

This project is open source and available under the MIT License.

## Contributors

Built with ❤️ for farmers and agriculture technology enthusiasts.

## Support

For issues or questions, please open an issue on the repository.
