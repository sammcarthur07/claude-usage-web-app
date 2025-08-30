#!/bin/bash

echo "🚀 Starting Claude Usage Monitor PWA Local Server..."
echo ""
echo "📍 Server will run at:"
echo "   http://localhost:8080"
echo "   http://127.0.0.1:8080"
echo ""
echo "📱 For Samsung S23 Ultra testing:"
echo "   Set browser to 412x915 resolution"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Check for Python 3 first, then Python 2
if command -v python3 &> /dev/null; then
    echo "Using Python 3..."
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "Using Python 2..."
    python -m SimpleHTTPServer 8080
else
    echo "❌ Python not found. Please install Python."
    exit 1
fi
