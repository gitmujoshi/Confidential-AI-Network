#!/bin/bash

# Convert IAM Specifications to PDF Document (Simple Method)
# This script converts the markdown IAM specifications to a PDF document using HTML as intermediate

echo "Converting IAM Specifications to PDF document (Simple Method)..."

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "Error: pandoc is not installed. Please install pandoc first."
    echo "Installation instructions:"
    echo "  macOS: brew install pandoc"
    echo "  Ubuntu/Debian: sudo apt-get install pandoc"
    echo "  Windows: Download from https://pandoc.org/installing.html"
    exit 1
fi

# Check if wkhtmltopdf is installed
if ! command -v wkhtmltopdf &> /dev/null; then
    echo "Installing wkhtmltopdf for PDF generation..."
    brew install wkhtmltopdf
fi

# Create output directory if it doesn't exist
mkdir -p ../output

# First convert markdown to HTML
echo "Converting markdown to HTML..."
pandoc IAM_SPECIFICATIONS_DOCUMENT.md \
    -o ../output/IAM_Specifications.html \
    --from markdown \
    --to html \
    --metadata title="Identity and Access Management (IAM) Specifications" \
    --metadata author="Contract Management System Team" \
    --metadata date="$(date +%Y-%m-%d)" \
    --toc \
    --number-sections \
    --standalone \
    --css=../styles/document.css

# Then convert HTML to PDF
echo "Converting HTML to PDF..."
wkhtmltopdf \
    --page-size A4 \
    --margin-top 0.75in \
    --margin-right 0.75in \
    --margin-bottom 0.75in \
    --margin-left 0.75in \
    --encoding utf-8 \
    --print-media-type \
    --enable-local-file-access \
    ../output/IAM_Specifications.html \
    ../output/IAM_Specifications.pdf

if [ $? -eq 0 ]; then
    echo "✅ Successfully converted to PDF document: ../output/IAM_Specifications.pdf"
    echo "📄 Document includes:"
    echo "   - Table of Contents"
    echo "   - Numbered sections"
    echo "   - Professional formatting"
    echo "   - Metadata (title, author, date)"
    echo "   - High-quality PDF output"
    
    # Clean up HTML file
    rm ../output/IAM_Specifications.html
else
    echo "❌ Error converting document"
    exit 1
fi

echo ""
echo "To open the document:"
echo "  open ../output/IAM_Specifications.pdf" 