const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            /* Recurse into a subdirectory */
            results = results.concat(walk(file));
        } else { 
            /* Is a file */
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./components').concat(walk('./lib')).concat(['App.tsx', 'main.tsx']);

let warnings = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    const arrayMethods = ['map', 'filter', 'reduce', 'find', 'some', 'every'];
    const regex = new RegExp(`([a-zA-Z0-9_]+(?:\\.[a-zA-Z0-9_]+)*)\\.(${arrayMethods.join('|')})\\(`, 'g');
    
    lines.forEach((line, i) => {
        let match;
        while ((match = regex.exec(line)) !== null) {
            const varName = match[1];
            const method = match[2];
            
            // Exclude common safe things like Object.keys, Object.entries, Array.from
            if (varName.includes('Object.keys') || varName.includes('Object.entries') || varName.includes('Array.from')) {
                continue;
            }
            // Exclude strings/inline arrays
            if (varName.endsWith(']') || varName.endsWith(')') || varName.endsWith('"') || varName.endsWith("'") || varName.endsWith('`')) {
                continue;
            }
            
            // Check if there's a fallback like (varName || []) or ?.map
            // (this regex is simple and won't catch everything, but gives an idea)
            if (!line.includes(`(${varName} || [])`) && !line.includes(`?\.${method}`)) {
                warnings.push({file, line: i + 1, match: match[0], code: line.trim()});
            }
        }
    });
});

fs.writeFileSync('audit_report.json', JSON.stringify(warnings, null, 2));
console.log(`Found ${warnings.length} potential issues. Check audit_report.json`);
