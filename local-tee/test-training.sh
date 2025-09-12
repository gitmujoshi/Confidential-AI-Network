#!/bin/bash

echo "🧪 Testing local training environment..."

# Test directory structure
echo "📁 Testing directory structure..."
if [ -d "environments" ] && [ -d "containers" ] && [ -d "data" ]; then
    echo "✅ Directory structure is correct"
else
    echo "❌ Directory structure is missing"
    exit 1
fi

# Test configuration
echo "⚙️ Testing configuration..."
if [ -f "config.json" ]; then
    echo "✅ Configuration file exists"
    python3 -m json.tool config.json > /dev/null && echo "✅ Configuration is valid JSON"
else
    echo "❌ Configuration file missing"
    exit 1
fi

# Test sample data
echo "📊 Testing sample data..."
if [ -f "data/samples/sample_data.csv" ]; then
    echo "✅ Sample data exists"
    wc -l data/samples/sample_data.csv
else
    echo "❌ Sample data missing"
    exit 1
fi

echo "✅ Local training environment test completed successfully!"
