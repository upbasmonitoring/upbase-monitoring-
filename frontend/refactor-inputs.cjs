const fs = require('fs');

const filesToRefactor = [
    'src/pages/dashboard/MonitorsPage.tsx',
    'src/pages/dashboard/IntegrationsPage.tsx'
];

filesToRefactor.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf-8');

    if (content.includes('import { Input } from "@/components/ui/input"')) {
        content = content.replace('import { Input } from "@/components/ui/input"', 'import { InputField } from "@/components/ui/input-field"');
    }

    const regex = /<label htmlFor="([^"]+)"[^>]*>([^<]+)<\/label>\s*<Input/g;
    
    content = content.replace(regex, (match, id, labelText) => {
        return `<InputField\n                                        id="${id}"\n                                        label="${labelText.replace(' (Integrity)', '')}"`;
    });

    // Special case for discord webhook in IntegrationsPage which lacks a direct label block right above it
    const discordWebhookRegex = /<Input\s+id="discord-webhook"/g;
    content = content.replace(discordWebhookRegex, '<InputField\n                            id="discord-webhook"\n                            label="Webhook Address"\n                            labelClassName="sr-only"');

    // Make sure we didn't miss <Input in other random places.
    // Dashboard sidebar might be unaffected.

    fs.writeFileSync(filePath, content, 'utf-8');
});

console.log('Refactoring complete.');
