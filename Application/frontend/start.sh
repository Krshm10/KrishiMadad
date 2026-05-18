#!/bin/bash

echo "🌿 Starting Plant Disease Detector Frontend..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start development server
echo ""
echo "✅ Starting React development server on http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""
npm run dev
