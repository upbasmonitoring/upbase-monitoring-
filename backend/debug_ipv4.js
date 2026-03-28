import { exec } from 'child_process';

const url = 'https://testing1-exq.pages.dev';

console.log(`Testing with native curl -4 (IPv4 Only)...`);
exec(`curl -4 -I ${url}`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Curl -4 Error: ${error.message}`);
        console.error(`Stderr: ${stderr}`);
        return;
    }
    console.log(`Stdout: ${stdout}`);
});
