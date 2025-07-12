# Document Conversion Guide

This guide explains how to convert the IAM Specifications document to different formats (Word, PDF, HTML).

## Directory Structure

```
ContractManagement/
├── docs/
│   ├── conversion/                           # Document conversion tools
│   │   ├── IAM_SPECIFICATIONS_DOCUMENT.md   # Source markdown
│   │   ├── convert_to_word.sh               # Word conversion script
│   │   ├── convert_to_pdf_basic.sh          # Basic PDF conversion
│   │   ├── convert_to_pdf.sh                # Advanced PDF conversion
│   │   ├── convert_to_pdf_simple.sh         # Simple PDF conversion
│   │   └── DOCUMENT_CONVERSION_README.md    # This guide
│   ├── styles/
│   │   └── document.css                     # Styling for HTML
│   └── output/                              # Generated documents
│       ├── IAM_Specifications.docx          # Word document
│       └── IAM_Specifications.html          # HTML document
```

## Available Formats

### 1. Microsoft Word (.docx)
- **File**: `docs/output/IAM_Specifications.docx`
- **Features**: 
  - Professional formatting
  - Table of Contents
  - Numbered sections
  - Metadata (title, author, date)
  - Editable format

### 2. HTML Document (.html)
- **File**: `docs/output/IAM_Specifications.html`
- **Features**:
  - Professional styling with CSS
  - Table of Contents
  - Numbered sections
  - Print-friendly design
  - Can be opened in any web browser

## Conversion Scripts

### Word Document Conversion
```bash
cd docs/conversion
./convert_to_word.sh
```
- Converts markdown to Word document
- Requires pandoc to be installed
- Output: `docs/output/IAM_Specifications.docx`

### PDF Conversion (Basic)
```bash
cd docs/conversion
./convert_to_pdf_basic.sh
```
- Attempts to convert directly to PDF
- Falls back to HTML if PDF conversion fails
- Requires pandoc to be installed
- Output: `docs/output/IAM_Specifications.html` (can be printed to PDF)

### PDF Conversion (Advanced)
```bash
cd docs/conversion
./convert_to_pdf.sh
```
- Uses LaTeX for high-quality PDF generation
- Requires pandoc and LaTeX to be installed
- Output: `docs/output/IAM_Specifications.pdf`

### PDF Conversion (Simple)
```bash
cd docs/conversion
./convert_to_pdf_simple.sh
```
- Uses HTML as intermediate format
- Requires pandoc and wkhtmltopdf
- Output: `docs/output/IAM_Specifications.pdf`

## Installation Requirements

### For Word Conversion
```bash
brew install pandoc
```

### For PDF Conversion (Basic)
```bash
brew install pandoc
```

### For PDF Conversion (Advanced)
```bash
brew install pandoc
brew install --cask mactex  # Large download (~4GB)
```

### For PDF Conversion (Simple)
```bash
brew install pandoc
brew install wkhtmltopdf
```

## Manual PDF Generation

If you have the HTML file, you can manually convert it to PDF:

1. **Open in Browser**: Open `docs/output/IAM_Specifications.html` in a web browser
2. **Print to PDF**: Use the browser's print function (Cmd+P on Mac)
3. **Save as PDF**: Choose "Save as PDF" as the destination
4. **Settings**: 
   - Page size: A4
   - Margins: Default
   - Include background graphics: Yes

## Document Features

### Professional Formatting
- Clean, modern design
- Consistent typography
- Professional color scheme
- Responsive layout

### Navigation
- Table of Contents with links
- Numbered sections
- Cross-references
- Easy navigation

### Content Structure
- Executive Summary
- Detailed specifications
- Code examples
- Configuration samples
- Implementation details

## Customization

### Modifying the Source
- Edit `docs/conversion/IAM_SPECIFICATIONS_DOCUMENT.md` to update content
- Run conversion scripts to regenerate formats

### Styling Changes
- Modify `docs/styles/document.css` for HTML styling
- Update pandoc parameters in conversion scripts

### Metadata
- Update title, author, and date in conversion scripts
- Modify document properties as needed

## Troubleshooting

### Common Issues

1. **Pandoc not found**
   ```bash
   brew install pandoc
   ```

2. **LaTeX not available for PDF**
   - Use the basic PDF conversion script
   - Or install LaTeX: `brew install --cask mactex`

3. **Styling issues in HTML**
   - Check that `docs/styles/document.css` exists
   - Verify CSS syntax

4. **Word document formatting issues**
   - Regenerate using the Word conversion script
   - Check pandoc version compatibility

5. **Path issues**
   - Make sure you're running scripts from `docs/conversion/` directory
   - Check that output directory exists: `mkdir -p docs/output`

### Getting Help

- Check pandoc documentation: https://pandoc.org/
- Review conversion script parameters
- Verify file permissions and paths

## Best Practices

1. **Always backup** the source markdown file before making changes
2. **Test conversions** after making significant changes
3. **Use version control** for tracking document changes
4. **Keep styling consistent** across different formats
5. **Validate output** by opening generated files

## Quick Start

To generate all formats:

```bash
# Navigate to conversion directory
cd docs/conversion

# Generate Word document
./convert_to_word.sh

# Generate HTML (can be printed to PDF)
./convert_to_pdf_basic.sh

# Open the documents
open ../output/IAM_Specifications.docx
open ../output/IAM_Specifications.html
```

## Running from Root Directory

If you want to run the conversion scripts from the project root:

```bash
# Generate Word document
cd docs/conversion && ./convert_to_word.sh

# Generate HTML document
cd docs/conversion && ./convert_to_pdf_basic.sh

# Open documents
open docs/output/IAM_Specifications.docx
open docs/output/IAM_Specifications.html
``` 