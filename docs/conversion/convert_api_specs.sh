#!/bin/bash

# Convert API Specifications to Word Document
# This script converts the API specifications markdown to a Word document

echo "Converting API Specifications to Word document..."

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

# Convert markdown to Word document
pandoc API_SPECIFICATIONS_DOCUMENT.md \
    -o ../output/API_Specifications.docx \
    --from markdown \
    --to docx \
    --metadata title="API Specifications - Contract Management System" \
    --metadata author="Contract Management System Team" \
    --metadata date="$(date +%Y-%m-%d)" \
    --toc \
    --number-sections \
    --variable geometry:margin=1in \
    --variable fontsize=11pt \
    --variable mainfont="Calibri" \
    --variable monofont="Consolas" \
    --variable colorlinks=true \
    --variable linkcolor=blue \
    --variable urlcolor=blue \
    --variable toccolor=gray

if [ $? -eq 0 ]; then
    echo "✅ Successfully converted to Word document: ../output/API_Specifications.docx"
    echo "📄 Document includes:"
    echo "   - Table of Contents"
    echo "   - Numbered sections"
    echo "   - Professional formatting"
    echo "   - Metadata (title, author, date)"
else
    echo "❌ Error converting document"
    exit 1
fi

echo ""
echo "To open the document:"
echo "  open ../output/API_Specifications.docx" 