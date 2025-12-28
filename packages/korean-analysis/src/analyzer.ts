import fs from 'fs';
import pdf from 'pdf-parse';
import { tokenizeKorean, countWordFrequencies } from './tokenizer';
import { Translator } from './translator';
import { WordFrequency } from './constants';

export interface WordWithTranslation extends WordFrequency {
    english?: string;
    description?: string;
}

/**
 * Analyze a PDF file and extract Korean words
 */
export async function analyzePDF(filePath: string): Promise<WordFrequency[]> {
    console.log(`Reading PDF: ${filePath}\n`);
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const text = data.text;
    
    console.log('Extracting all Korean words from PDF...\n');
    
    const tokens = tokenizeKorean(text);
    console.log(`Found ${tokens.length} Korean word tokens in PDF`);
    
    const vocabularyFrequencies = countWordFrequencies(tokens);
    console.log(`Found ${vocabularyFrequencies.length} unique Korean words\n`);
    
    return vocabularyFrequencies;
}

/**
 * Analyze a CSV file and extract Korean words
 */
export function analyzeCSV(filePath: string): WordFrequency[] {
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
    
    const vocabularyFrequencies = countWordFrequencies(words);
    console.log(`Found ${vocabularyFrequencies.length} unique Korean words from CSV\n`);
    
    return vocabularyFrequencies;
}

/**
 * Analyze a file (PDF or CSV) and return word frequencies
 */
export async function analyzeFile(filePath: string): Promise<WordFrequency[]> {
    if (filePath.endsWith('.csv')) {
        return analyzeCSV(filePath);
    } else {
        return analyzePDF(filePath);
    }
}

/**
 * Translate words using OpenAI API if available
 */
export async function translateWords(
    words: WordFrequency[],
    apiKey?: string
): Promise<WordWithTranslation[]> {
    const translator = new Translator(apiKey);
    return await translator.translateWords(words);
}

/**
 * Display top N words to console
 */
export function displayTopWords(words: WordFrequency[], count: number = 20): void {
    console.log(`\nTop ${count} Korean words:`);
    console.log('-'.repeat(40));
    words.slice(0, count).forEach(({ word, count }, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${word.padEnd(15)} (${count} times)`);
    });
}

