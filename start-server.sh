#!/bin/bash

echo "🚀 Claude Usage Monitor PWA - Server Launcher"
echo "============================================"
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "Starting with Python server..."
    echo "Server running at: http://localhost:8080"
    echo ""
    echo "📱 To access from mobile on same network:"
    echo "   http://$(hostname -I | awk '{print $1}'):8080"
    echo ""
    echo "Press Ctrl+C to stop the server"
    python3 -m http.server 8080
elif command -v node &> /dev/null; then
    echo "Starting with Node.js server..."
    npx serve -s . -l 8080
else
    echo "❌ No suitable server found!"
    echo "Please install Python 3 or Node.js"
    echo ""
    echo "Install Python:"
    echo "  pkg install python"
    echo ""
    echo "Install Node.js:"
    echo "  pkg install nodejs"
fi