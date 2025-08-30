#!/usr/bin/env python3
"""
Enhanced HTTP Server for Claude Usage Monitor PWA Testing
Supports proper MIME types, CORS, and PWA requirements
"""

import http.server
import socketserver
import os
import mimetypes
import json
from urllib.parse import urlparse, parse_qs
import threading
import time

class PWAHandler(http.server.SimpleHTTPRequestHandler):
    """Enhanced handler for PWA testing with proper headers"""
    
    def end_headers(self):
        # Add security headers
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-XSS-Protection', '1; mode=block')
        
        # PWA headers
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        # CORS headers for testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        super().end_headers()
    
    def guess_type(self, path):
        """Enhanced MIME type detection"""
        mimetype, encoding = mimetypes.guess_type(path)
        
        # Override for PWA files
        if path.endswith('.webmanifest') or path.endswith('manifest.json'):
            return 'application/manifest+json'
        elif path.endswith('.js'):
            return 'application/javascript'
        elif path.endswith('.mjs'):
            return 'application/javascript'
        elif path.endswith('.css'):
            return 'text/css'
        elif path.endswith('.svg'):
            return 'image/svg+xml'
        elif path.endswith('.webp'):
            return 'image/webp'
        elif path.endswith('.ico'):
            return 'image/x-icon'
            
        return mimetype
    
    def do_GET(self):
        """Handle GET requests with proper routing"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # API mock endpoints
        if path.startswith('/api/'):
            self.handle_api_request(path, parsed_path.query)
            return
            
        # Serve PWA files
        super().do_GET()
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.end_headers()
    
    def handle_api_request(self, path, query):
        """Mock API responses for testing"""
        try:
            if path == '/api/validate':
                # Mock API key validation
                response = {'valid': True, 'message': 'API key is valid'}
            elif path == '/api/usage':
                # Mock usage data
                response = self.generate_mock_usage_data()
            else:
                response = {'error': 'Endpoint not found'}
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = {'error': str(e)}
            self.wfile.write(json.dumps(error_response).encode())
    
    def generate_mock_usage_data(self):
        """Generate realistic mock usage data"""
        import random
        from datetime import datetime, timedelta
        
        # Generate daily usage for last 7 days
        daily_usage = []
        base_date = datetime.now()
        
        for i in range(6, -1, -1):
            date = base_date - timedelta(days=i)
            tokens = random.randint(10000, 150000)
            daily_usage.append({
                'date': date.strftime('%Y-%m-%d'),
                'tokens': tokens,
                'apiCalls': tokens // 500,
                'cost': tokens * 0.00003
            })
        
        # Calculate totals
        total_tokens = sum(day['tokens'] for day in daily_usage)
        total_calls = sum(day['apiCalls'] for day in daily_usage)
        
        return {
            'totalTokens': total_tokens,
            'apiCalls': total_calls,
            'opusCost': total_tokens * 0.00002,
            'sonnetCost': total_tokens * 0.00001,
            'haikuCost': total_tokens * 0.000005,
            'totalCost': total_tokens * 0.000035,
            'webTokens': int(total_tokens * 0.7),
            'terminalTokens': int(total_tokens * 0.3),
            'dailyUsage': daily_usage,
            'usageLimit': 5000000,
            'lastUpdated': datetime.now().isoformat()
        }
    
    def log_message(self, format, *args):
        """Enhanced logging for testing"""
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

def start_test_server(port=8080):
    """Start the enhanced test server"""
    print(f"🚀 Claude Usage Monitor - Test Server")
    print(f"=========================================")
    print(f"📍 Server starting on port {port}")
    print(f"🌐 Open: http://localhost:{port}")
    print(f"📱 Mobile: http://[your-ip]:{port}")
    print(f"")
    print(f"🔧 Features enabled:")
    print(f"   ✅ PWA manifest support")
    print(f"   ✅ Service Worker compatibility")
    print(f"   ✅ Mock API endpoints")
    print(f"   ✅ CORS headers for testing")
    print(f"   ✅ Proper MIME types")
    print(f"")
    print(f"📋 Test endpoints:")
    print(f"   GET  /api/usage   - Mock usage data")
    print(f"   GET  /api/validate - API key validation")
    print(f"")
    print(f"Press Ctrl+C to stop")
    print(f"=========================================")
    
    try:
        with socketserver.TCPServer(("", port), PWAHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped")
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"❌ Port {port} already in use. Try a different port.")
            print(f"   python3 test-server.py --port 8081")
        else:
            print(f"❌ Server error: {e}")

if __name__ == "__main__":
    import sys
    port = 8080
    
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            if '--port' in sys.argv:
                try:
                    port = int(sys.argv[sys.argv.index('--port') + 1])
                except (IndexError, ValueError):
                    pass
    
    start_test_server(port)