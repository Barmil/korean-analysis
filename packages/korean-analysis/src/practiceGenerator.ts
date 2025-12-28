import fs from 'fs';
import path from 'path';
import { FileWriter } from './fileWriter';
import { WordWithTranslation } from './analyzer';

const OUTPUT_DIR = path.resolve(__dirname, '../../output');
const fileWriter = new FileWriter(OUTPUT_DIR);

/**
 * Generate practice HTML file with embedded vocabulary
 */
export function generatePracticeFile(words: WordWithTranslation[]): string {
    console.log('\nGenerating HTML file...');
    
    // Read template
    const templatePath = path.resolve(__dirname, '../template/korean-practice-template.html');
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholder with vocabulary JSON
    const vocabularyJson = JSON.stringify(words);
    const htmlContent = template.replace('{{VOCABULARY_JSON}}', vocabularyJson);
    
    // Save HTML file - return absolute path
    const htmlPath = path.resolve(OUTPUT_DIR, 'korean-practice.html');
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    
    return htmlPath;
}

/**
 * Save vocabulary to CSV files
 */
export function saveVocabularyFiles(
    wordsWithTranslations: WordWithTranslation[],
    allWords: { word: string; count: number }[]
): void {
    // Save words as CSV with translations
    fileWriter.saveAsCSV(wordsWithTranslations, 'korean_vocabulary.csv');
    
    // Also save all words without translations
    fileWriter.saveAsCSV(allWords, 'korean_words.csv');
    
    console.log(`Words with translations: ${path.resolve(OUTPUT_DIR, 'korean_vocabulary.csv')}`);
    console.log(`All words: ${path.resolve(OUTPUT_DIR, 'korean_words.csv')}`);
}

