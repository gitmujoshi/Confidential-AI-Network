const fs = require('fs');
const path = require('path');

// Function to clean up Mermaid content and fix syntax errors
function fixMermaidSyntax(mermaidContent) {
    let cleaned = mermaidContent;
    
    // Remove HTML tags that got mixed in
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Fix line breaks - replace <p> with actual newlines
    cleaned = cleaned.replace(/<p>/g, '\n');
    cleaned = cleaned.replace(/<\/p>/g, '');
    
    // Fix sequence diagram syntax
    cleaned = cleaned.replace(/participant ([^<]+)<p>/g, 'participant $1\n');
    
    // Fix arrow syntax in sequence diagrams
    cleaned = cleaned.replace(/([A-Z]+)->>([A-Z]+): ([^<]+)<p>/g, '$1->>$2: $3\n');
    
    // Fix graph syntax
    cleaned = cleaned.replace(/([A-Z_]+) --> ([A-Z_]+)/g, '$1 --> $2\n');
    
    // Clean up extra whitespace and normalize line breaks
    cleaned = cleaned.replace(/\n\s*\n/g, '\n');
    cleaned = cleaned.replace(/\s+$/gm, '');
    
    // Ensure proper Mermaid syntax
    if (cleaned.includes('sequenceDiagram')) {
        // Fix sequence diagram formatting
        cleaned = cleaned.replace(/participant ([^<]+)/g, 'participant $1');
        cleaned = cleaned.replace(/([A-Z]+)->>([A-Z]+): ([^\n]+)/g, '$1->>$2: $3');
    }
    
    if (cleaned.includes('graph')) {
        // Fix graph formatting
        cleaned = cleaned.replace(/([A-Z_]+) --> ([A-Z_]+)/g, '$1 --> $2');
    }
    
    return cleaned.trim();
}

// Function to fix all HTML files with Mermaid syntax errors
function fixAllMermaidSyntaxErrors() {
    const docsDir = path.join(__dirname, 'docs');
    const htmlFiles = fs.readdirSync(docsDir).filter(file => file.endsWith('.html'));
    
    console.log('🔄 Fixing Mermaid syntax errors in all HTML documentation...\n');
    
    htmlFiles.forEach(file => {
        const filePath = path.join(docsDir, file);
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let hasChanges = false;
            
            // Find and fix all Mermaid divs
            content = content.replace(
                /<div class="mermaid">([\s\S]*?)<\/div>/g,
                (match, mermaidContent) => {
                    const fixedContent = fixMermaidSyntax(mermaidContent);
                    if (fixedContent !== mermaidContent) {
                        hasChanges = true;
                        console.log(`✅ Fixed Mermaid syntax in ${file}`);
                    }
                    return `<div class="mermaid">${fixedContent}</div>`;
                }
            );
            
            if (hasChanges) {
                fs.writeFileSync(filePath, content, 'utf8');
            } else {
                console.log(`ℹ️  No syntax errors found in: ${file}`);
            }
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
        }
    });
    
    console.log('\n✅ All Mermaid syntax errors fixed!');
    console.log('📊 Diagrams should now render properly as visual charts');
}

// Run the fix
fixAllMermaidSyntaxErrors(); 