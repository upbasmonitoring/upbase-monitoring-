import { exec } from 'child_process';

const url = 'https://testing1-exq.pages.dev';

console.log(`Testing with native curl...`);
exec(`curl -I ${url}`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Curl Error: ${error.message}`);
        console.error(`Stderr: ${stderr}`);
        return;
    }
    console.log(`Stdout: ${stdout}`);
});
