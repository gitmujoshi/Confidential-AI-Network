#!/usr/bin/env python3
import http.server
import socketserver
import time
import json
import uuid
from urllib.parse import urlparse, parse_qs

# In-memory storage for development
claims_store = {}
contracts_store = {}

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
            
        elif self.path.startswith("/app/claims"):
            # Get claims endpoint
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            
            # Parse query parameters
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            
            if 'contractId' in query_params:
                contract_id = query_params['contractId'][0]
                contract_claims = [claim for claim in claims_store.values() if claim.get('data', {}).get('contractId') == contract_id]
                response = contract_claims
            else:
                response = list(claims_store.values())
            
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
            self.wfile.write(b'Not Found - Try /app/health, /governance/health, or /app/claims')
    
    def do_POST(self):
        if self.path == "/app/claims":
            # Submit claim endpoint
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                claim_data = json.loads(post_data.decode('utf-8'))
                
                # Generate claim ID
                claim_id = f"CLAIM-{int(time.time())}-{str(uuid.uuid4())[:8]}"
                
                # Store claim
                claim = {
                    "claimId": claim_id,
                    "type": claim_data.get("type", "contract_creation"),
                    "data": claim_data.get("data", {}),
                    "status": "SUBMITTED",
                    "timestamp": int(time.time()),
                    "receipt": f"RECEIPT-{claim_id}",
                    "blockchainTx": f"0x{str(uuid.uuid4()).replace('-', '')[:64]}"
                }
                
                claims_store[claim_id] = claim
                
                # Store contract reference
                contract_id = claim_data.get("data", {}).get("contractId")
                if contract_id:
                    if contract_id not in contracts_store:
                        contracts_store[contract_id] = []
                    contracts_store[contract_id].append(claim_id)
                
                # Return success response
                self.send_response(201)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                
                response = {
                    "success": True,
                    "claimId": claim_id,
                    "receipt": claim["receipt"],
                    "status": "SUBMITTED",
                    "blockchainTx": claim["blockchainTx"],
                    "message": "Claim submitted successfully to SCITT CCF"
                }
                
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                error_response = {"error": "Failed to process claim", "message": str(e)}
                self.wfile.write(json.dumps(error_response).encode())
        else:
            self.send_response(404)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(b'Endpoint not found')
    
    def log_message(self, format, *args):
        print(f"[SCITT CCF] {format % args}")

if __name__ == "__main__":
    print("Starting SCITT CCF Unified Service...")
    print("✅ Node endpoint: /app/health")
    print("✅ Governance endpoint: /governance/health")
    print("✅ Claims endpoint: /app/claims")
    print("🚀 Service is running on port 8000")
    
    try:
        with socketserver.TCPServer(("0.0.0.0", 8000), UnifiedHandler) as httpd:
            httpd.serve_forever()
    except Exception as e:
        print(f"❌ Failed to start service: {e}")
        import sys
        sys.exit(1)
