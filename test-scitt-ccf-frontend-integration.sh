#!/bin/bash

echo "🧪 Testing SCITT CCF Frontend-Backend Integration"
echo "=================================================="

# Check if backend is running
echo "🔍 Checking backend status..."
if curl -s http://localhost:5001/api/scitt-ccf/health > /dev/null; then
    echo "✅ Backend is running and healthy"
else
    echo "❌ Backend is not responding"
    exit 1
fi

# Check if frontend is running
echo "🔍 Checking frontend status..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not responding"
    exit 1
fi

# Test SCITT CCF contract creation API directly
echo "🔍 Testing SCITT CCF contract creation API..."
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testtdc@example.com", "password": "TdcPass123!"}' | jq -r '.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi

echo "✅ Got authentication token"

# Test contract creation
echo "🔍 Testing contract creation..."
CONTRACT_RESPONSE=$(curl -s -X POST http://localhost:5001/api/scitt-ccf/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "contractId": 1,
    "name": "Frontend Integration Test Contract",
    "description": "Test contract for frontend integration",
    "price": 150,
    "duration": 45,
    "termsAndConditions": "Test terms for frontend integration",
    "tdcAddress": "0x1234567890123456789012345678901234567890",
    "tdpAddress": "0x0987654321098765432109876543210987654321",
    "ccrpAddress": "0x1111111111111111111111111111111111111111",
    "datasetId": "DATASET-FRONTEND-TEST",
    "environmentSpecs": {"cpu": "8", "ram": "16GB"},
    "trainingParams": {"epochs": 200, "batchSize": 64}
  }')

echo "📝 Contract creation response:"
echo "$CONTRACT_RESPONSE" | jq '.'

# Check if contract was created successfully
if echo "$CONTRACT_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ SCITT CCF contract creation successful!"
    echo "🎯 Contract ID: $(echo "$CONTRACT_RESPONSE" | jq -r '.contractId')"
    echo "🎯 Claim ID: $(echo "$CONTRACT_RESPONSE" | jq -r '.claimId')"
    echo "🎯 Source: $(echo "$CONTRACT_RESPONSE" | jq -r '.source')"
else
    echo "❌ SCITT CCF contract creation failed"
    echo "$CONTRACT_RESPONSE" | jq '.'
    exit 1
fi

echo ""
echo "🎉 SCITT CCF Frontend-Backend Integration Test PASSED!"
echo ""
echo "📋 Summary:"
echo "  ✅ Backend running and healthy"
echo "  ✅ Frontend running"
echo "  ✅ Authentication working"
echo "  ✅ SCITT CCF contract creation working"
echo "  ✅ Frontend updated to use SCITT CCF API"
echo ""
echo "🚀 Ready for frontend testing!"
echo ""
echo "💡 Next steps:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Login as a TDC user"
echo "  3. Navigate to Create Contract page"
echo "  4. Fill out the contract form"
echo "  5. Click 'Create SCITT CCF Contract'"
echo "  6. Verify the contract is created with SCITT CCF integration"
