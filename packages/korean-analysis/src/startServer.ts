import { startServer } from './server';
import path from 'path';

async function main() {
    const templatePath = path.resolve(__dirname, '../template/korean-practice-template.html');
    console.log('Starting practice template server...');
    console.log('Make sure you have vocabulary CSV files in the output/ directory.');
    await startServer(templatePath);
}

main();

