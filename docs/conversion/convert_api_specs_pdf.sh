#!/bin/bash

# Convert API Specifications to PDF Document (Basic Method)
# This script converts the API specifications markdown to a PDF document using basic pandoc

echo "Converting API Specifications to PDF document (Basic Method)..."

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "Error: pandoc is not installed. Please install pandoc first."
    echo "Installation instructions:"
    echo "  macOS: brew install pandoc"
    echo "  Ubuntu/Debian: sudo apt-get install pandoc"
    echo "  Windows: Download from https://pandoc.org/installing.html"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p ../output

# Convert markdown to PDF using basic pandoc
echo "Converting markdown to PDF..."
pandoc API_SPECIFICATIONS_DOCUMENT.md \
    -o ../output/API_Specifications.pdf \
    --from markdown \
    --to pdf \
    --metadata title="API Specifications - Contract Management System" \
    --metadata author="Contract Management System Team" \
    --metadata date="$(date +%Y-%m-%d)" \
    --toc \
    --number-sections \
    --pdf-engine=weasyprint

if [ $? -eq 0 ]; then
    echo "✅ Successfully converted to PDF document: ../output/API_Specifications.pdf"
    echo "📄 Document includes:"
    echo "   - Table of Contents"
    echo "   - Numbered sections"
    echo "   - Professional formatting"
    echo "   - Metadata (title, author, date)"
else
    echo "❌ Error converting document"
    echo "Trying alternative method..."
    
    # Try alternative method using HTML as intermediate
    pandoc API_SPECIFICATIONS_DOCUMENT.md \
        -o ../output/API_Specifications.html \
        --from markdown \
        --to html \
        --metadata title="API Specifications - Contract Management System" \
        --metadata author="Contract Management System Team" \
        --metadata date="$(date +%Y-%m-%d)" \
        --toc \
        --number-sections \
        --standalone \
        --css=../styles/document.css
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully converted to HTML: ../output/API_Specifications.html"
        echo "📄 You can open this HTML file in a browser and print to PDF"
        echo "   open ../output/API_Specifications.html"
    else
        echo "❌ Error converting document"
        exit 1
    fi
fi

echo ""
echo "To open the document:"
if [ -f "../output/API_Specifications.pdf" ]; then
    echo "  open ../output/API_Specifications.pdf"
else
    echo "  open ../output/API_Specifications.html"
fi 