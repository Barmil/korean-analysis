import 'dotenv/config';
import fs from 'fs';
import pdf from 'pdf-parse';
import { tokenizeKorean, countWordFrequencies } from './src/tokenizer';
import { extractVocabularySections } from './src/vocabulary';
import { FileWriter } from './src/fileWriter';
import { startServer } from './src/server';
import { Translator } from './src/translator';
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
        // Get PDF file path from command line arguments
        const pdfPath = process.argv[2];
        
        if (!pdfPath) {
            console.error('Error: PDF file path required');
            console.error('Usage: npm start <pdf-file-path>');
            process.exit(1);
        }
        
        if (!fs.existsSync(pdfPath)) {
            console.error(`Error: File not found: ${pdfPath}`);
            console.error('Usage: npm start [pdf-file-path]');
            process.exit(1);
        }
        
        console.log(`Reading PDF: ${pdfPath}\n`);
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        const text = data.text;
        
        console.log('Extracting Korean words from PDF...\n');
        
        // Extract vocabulary sections
        console.log('Identifying vocabulary sections...');
        const vocabularySections = extractVocabularySections(text);
        console.log(`Found ${vocabularySections.length} vocabulary sections\n`);
        
        // Display vocabulary sections
        vocabularySections.forEach((section, index) => {
            const uniqueWords = [...new Set(section.words)];
            console.log(`Section ${index + 1}: ${section.title.substring(0, 40)}`);
            console.log(`  - ${uniqueWords.length} unique words, ${section.words.length} total tokens`);
        });
        
        // Combine all vocabulary words
        const allVocabularyWords: string[] = [];
        vocabularySections.forEach(section => {
            allVocabularyWords.push(...section.words);
        });
        
        // Count vocabulary word frequencies
        const vocabularyFrequencies = countWordFrequencies(allVocabularyWords);
        console.log(`\nTotal vocabulary words: ${vocabularyFrequencies.length} unique words`);
        
        // Display top 20 vocabulary words
        console.log('\nTop 20 vocabulary words:');
        console.log('-'.repeat(40));
        vocabularyFrequencies.slice(0, 20).forEach(({ word, count }, index) => {
            console.log(`${(index + 1).toString().padStart(2)}. ${word.padEnd(15)} (${count} times)`);
        });
        
        // Translate vocabulary words if API key is provided
        const translator = new Translator(process.env.OPENAI_API_KEY);
        const vocabularyWithTranslations = await translator.translateWords(vocabularyFrequencies);
        
        // Save vocabulary words as CSV with translations
        fileWriter.saveAsCSV(vocabularyWithTranslations, 'korean_vocabulary.csv');
        
        // Also do full text analysis (original functionality)
        console.log('\nAnalyzing full text...');
        const tokens = tokenizeKorean(text);
        console.log(`Found ${tokens.length} Korean word tokens in full text`);
        
        const wordFrequencies = countWordFrequencies(tokens);
        console.log(`Found ${wordFrequencies.length} unique Korean words in full text\n`);
        
        // Save all words as CSV only
        fileWriter.saveAsCSV(wordFrequencies, 'korean_words.csv');
        
        console.log('\nAnalysis complete.');
        console.log(`Vocabulary CSV: output/korean_vocabulary.csv`);
        console.log(`All words CSV: output/korean_words.csv`);
        
        // Start local web server and open HTML template in browser
        const templatePath = path.resolve('template/korean-practice-template.html');
        if (fs.existsSync(templatePath)) {
            console.log('\nStarting local web server...');
            await startServer(templatePath);
        } else {
            console.log(`\nTemplate not found at: ${templatePath}`);
        }
        
    } catch (error) {
        console.error('Error parsing PDF:', error);
        process.exit(1);
    }
}

main();
