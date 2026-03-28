const fs = require('fs');

const filesToRefactor = [
    'src/pages/dashboard/MonitorsPage.tsx',
    'src/pages/dashboard/IntegrationsPage.tsx'
];

filesToRefactor.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Make sure InputField is imported
    if (!content.includes('import { InputField }')) {
        content = content.replace('import { Input }', 'import { InputField }\nimport { Input }');
    }

    // Replace all remaining exact "<Input" with "<InputField"
    content = content.replace(/<Input\b/g, '<InputField');

    fs.writeFileSync(filePath, content, 'utf-8');
});

console.log('Final Input refactoring complete.');
