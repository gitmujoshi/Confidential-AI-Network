#!/usr/bin/env python3
import http.server
import socketserver
import time
import json

class UnifiedHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/app/health":
            # Main node health endpoint
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            response = {"status": "healthy", "service": "node", "timestamp": int(time.time())}
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == "/governance/health":
            # Governance health endpoint (simulated on same port)
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            response = {"status": "healthy", "service": "governance", "timestamp": int(time.time())}
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == "/":
            self.send_response(200)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(b'SCITT CCF Unified Service - Node and Governance endpoints available')
            
        else:
            self.send_response(404)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(b'Not Found - Try /app/health or /governance/health')
    
    def log_message(self, format, *args):
        print(f"[SCITT CCF] {format % args}")

if __name__ == "__main__":
    print("Starting SCITT CCF Unified Service...")
    print("✅ Node endpoint: /app/health")
    print("✅ Governance endpoint: /governance/health")
    print("🚀 Service is running on port 8000")
    
    try:
        with socketserver.TCPServer(("0.0.0.0", 8000), UnifiedHandler) as httpd:
            httpd.serve_forever()
    except Exception as e:
        print(f"❌ Failed to start service: {e}")
        import sys
        sys.exit(1)
