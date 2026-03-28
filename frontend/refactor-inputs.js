const fs = require('fs');
const path = require('path');

const filesToRefactor = [
    'src/pages/dashboard/MonitorsPage.tsx',
    'src/pages/dashboard/IntegrationsPage.tsx'
];

filesToRefactor.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf-8');

    // 1. Replace Import
    if (content.includes('import { Input } from "@/components/ui/input"')) {
        content = content.replace('import { Input } from "@/components/ui/input"', 'import { InputField } from "@/components/ui/input-field"');
    }

    // 2. Replace structure
    // We are looking for:
    // <div className="space-y-2">\s*<label htmlFor="XYZ".*?>LABEL_TEXT</label>\s*<Input\s+id="XYZ".*?/>\s*</div>
    // or similar patterns.
    
    // A more aggressive regex to find all <Input ... /> tags and convert them into InputField. 
    // Wait, some inputs might not have labels right above them. 
    // In MonitorsPage and IntegrationsPage, ALMOST ALL inputs are preceded by a label! 
    
    let regex = /<label htmlFor="([^"]+)"[^>]*>([^<]+)<\/label>\s*<Input([^>]*)\/>/g;
    
    content = content.replace(regex, (match, id, labelText, inputProps) => {
        // Strip out id=... and name=... if they exist in inputProps, or leave them and just prepend label=
        
        let newProps = inputProps;
        // Make sure we carry over the id and add label
        return `<InputField\n    id="${id}"\n    label="${labelText.replace(' (Integrity)', '')}"${newProps}/>`;
    });

    fs.writeFileSync(filePath, content, 'utf-8');
});

console.log('Refactoring complete.');
