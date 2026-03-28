const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir('src');

files.forEach(file => {
    const code = fs.readFileSync(file, 'utf-8');
    
    // Find <InputField ... /> elements
    const inputFieldRegex = /<InputField([^>]*)\/>/g;
    let match;
    while ((match = inputFieldRegex.exec(code)) !== null) {
        const props = match[1];
        if (!props.includes('name="') && !props.includes('name={')) {
            console.log(`Missing name attribute in ${file}:\n<InputField${props}/>\n`);
        }
        if (!props.includes('id="') && !props.includes('id={')) {
            console.log(`Missing id attribute in ${file}:\n<InputField${props}/>\n`);
        }
    }
    
    // Find <Input ... /> elements
    const inputRegex = /<Input\s+([^>]*)\/>/g;
    let inputMatch;
    while ((inputMatch = inputRegex.exec(code)) !== null) {
        const props = inputMatch[1];
        if (!props.includes('name="') && !props.includes('name={')) {
            console.log(`Missing name attribute in ${file}:\n<Input ${props}/>\n`);
        }
        if (!props.includes('id="') && !props.includes('id={')) {
            console.log(`Missing id attribute in ${file}:\n<Input ${props}/>\n`);
        }
    }
});
console.log('Scan complete.');
