import 'dotenv/config';
import fs from 'fs';
import pdf from 'pdf-parse';
import { tokenizeKorean, countWordFrequencies } from './src/tokenizer';
import { FileWriter } from './src/fileWriter';
import { Translator } from './src/translator';
import { exec } from 'child_process';
import path from 'path';

const OUTPUT_DIR = 'output';
const fileWriter = new FileWriter(OUTPUT_DIR);

// Clean up old output directories on start
try {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
} catch (e) {
    // Directory doesn't exist, that's fine
}

async function main() {
    try {
        // Get file path from command line arguments
        const filePath = process.argv[2];
        
        if (!filePath) {
            console.error('Error: File path required');
            console.error('Usage: npm start <pdf-file-path> or <csv-file-path>');
            process.exit(1);
        }
        
        if (!fs.existsSync(filePath)) {
            console.error(`Error: File not found: ${filePath}`);
            console.error('Usage: npm start [pdf-file-path] or [csv-file-path]');
            process.exit(1);
        }
        
        let vocabularyFrequencies: { word: string; count: number }[] = [];
        
        // Check if it's a CSV file
        if (filePath.endsWith('.csv')) {
            console.log(`Reading CSV file: ${filePath}\n`);
            const csvContent = fs.readFileSync(filePath, 'utf8');
            const lines = csvContent.split('\n').filter(line => line.trim());
            
            // Parse CSV - expect format: Word,English or just Word
            const words: string[] = [];
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Skip header line if it exists
                if (i === 0 && /^Word|^word|^Korean/i.test(line)) {
                    continue;
                }
                
                // Extract Korean word (first column, remove quotes)
                const match = line.match(/^"([^"]+)"|^([^,]+)/);
                if (match) {
                    const word = (match[1] || match[2]).trim();
                    // Check if it's Korean
                    if (/[\uAC00-\uD7A3]/.test(word)) {
                        words.push(word);
                    }
                }
            }
            
            vocabularyFrequencies = countWordFrequencies(words);
            console.log(`Found ${vocabularyFrequencies.length} unique Korean words from CSV\n`);
        } else {
            // PDF file
            console.log(`Reading PDF: ${filePath}\n`);
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            const text = data.text;
            
            console.log('Extracting all Korean words from PDF...\n');
            
            // Extract all Korean words directly (no vocabulary section filtering)
            const tokens = tokenizeKorean(text);
            console.log(`Found ${tokens.length} Korean word tokens in PDF`);
            
            vocabularyFrequencies = countWordFrequencies(tokens);
            console.log(`Found ${vocabularyFrequencies.length} unique Korean words\n`);
        }
        
        // Display top 20 words
        console.log('\nTop 20 Korean words:');
        console.log('-'.repeat(40));
        vocabularyFrequencies.slice(0, 20).forEach(({ word, count }, index) => {
            console.log(`${(index + 1).toString().padStart(2)}. ${word.padEnd(15)} (${count} times)`);
        });
        
        // Translate words if API key is provided
        const translator = new Translator(process.env.OPENAI_API_KEY);
        const wordsWithTranslations = await translator.translateWords(vocabularyFrequencies);
        
        // Save words as CSV with translations
        fileWriter.saveAsCSV(wordsWithTranslations, 'korean_vocabulary.csv');
        
        // Also save all words without translations
        fileWriter.saveAsCSV(vocabularyFrequencies, 'korean_words.csv');
        
        // Generate HTML file with words embedded
        console.log('\nGenerating HTML file...');
        const templatePath = path.resolve('template/korean-practice-template.html');
        const template = fs.readFileSync(templatePath, 'utf8');
        
        // Replace placeholder with vocabulary JSON
        const vocabularyJson = JSON.stringify(wordsWithTranslations);
        const htmlContent = template.replace('{{VOCABULARY_JSON}}', vocabularyJson);
        
        const htmlPath = path.join(OUTPUT_DIR, 'korean-practice.html');
        fs.writeFileSync(htmlPath, htmlContent, 'utf8');
        
        console.log('\nAnalysis complete.');
        console.log(`Words with translations: output/korean_vocabulary.csv`);
        console.log(`All words: output/korean_words.csv`);
        console.log(`Practice HTML: ${htmlPath}`);
        
        // Open HTML file in browser
        const openCommand = process.platform === 'darwin' ? 'open' : 
                           process.platform === 'win32' ? 'start' : 'xdg-open';
        exec(`${openCommand} "${htmlPath}"`, (error) => {
            if (error) {
                console.log(`\nCould not open browser automatically. Please open: ${htmlPath}`);
            }
        });
        
    } catch (error) {
        console.error('Error parsing PDF:', error);
        process.exit(1);
    }
}

main();
