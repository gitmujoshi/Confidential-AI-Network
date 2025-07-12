#!/bin/bash

# Convert IAM Specifications to PDF Document
# This script converts the markdown IAM specifications to a PDF document

echo "Converting IAM Specifications to PDF document..."

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "Error: pandoc is not installed. Please install pandoc first."
    echo "Installation instructions:"
    echo "  macOS: brew install pandoc"
    echo "  Ubuntu/Debian: sudo apt-get install pandoc"
    echo "  Windows: Download from https://pandoc.org/installing.html"
    exit 1
fi

# Check if LaTeX is installed (required for PDF generation)
if ! command -v pdflatex &> /dev/null; then
    echo "Error: LaTeX is not installed. Please install LaTeX first."
    echo "Installation instructions:"
    echo "  macOS: brew install --cask mactex"
    echo "  Ubuntu/Debian: sudo apt-get install texlive-full"
    echo "  Windows: Install MiKTeX from https://miktex.org/"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p ../output

# Convert markdown to PDF document
pandoc IAM_SPECIFICATIONS_DOCUMENT.md \
    -o ../output/IAM_Specifications.pdf \
    --from markdown \
    --to pdf \
    --metadata title="Identity and Access Management (IAM) Specifications" \
    --metadata author="Contract Management System Team" \
    --metadata date="$(date +%Y-%m-%d)" \
    --toc \
    --number-sections \
    --variable geometry:margin=1in \
    --variable fontsize=11pt \
    --variable mainfont="DejaVu Sans" \
    --variable monofont="DejaVu Sans Mono" \
    --variable colorlinks=true \
    --variable linkcolor=blue \
    --variable urlcolor=blue \
    --variable toccolor=gray \
    --pdf-engine=pdflatex

if [ $? -eq 0 ]; then
    echo "✅ Successfully converted to PDF document: ../output/IAM_Specifications.pdf"
    echo "📄 Document includes:"
    echo "   - Table of Contents"
    echo "   - Numbered sections"
    echo "   - Professional formatting"
    echo "   - Metadata (title, author, date)"
    echo "   - High-quality PDF output"
else
    echo "❌ Error converting document"
    exit 1
fi

echo ""
echo "To open the document:"
echo "  open ../output/IAM_Specifications.pdf" 