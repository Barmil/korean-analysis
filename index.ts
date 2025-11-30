import 'dotenv/config';
import fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import { analyzeFile, translateWords, displayTopWords } from './src/analyzer';
import { generatePracticeFile, saveVocabularyFiles } from './src/practiceGenerator';

const execAsync = promisify(exec);

const OUTPUT_DIR = 'output';

// Clean up old output directories on start
try {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
} catch (e) {
    // Directory doesn't exist, that's fine
}

/**
 * Get and validate command line arguments
 */
function getAndValidateArgs(): string {
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
    
    return filePath;
}

/**
 * Open file in default browser
 */
async function openFile(filePath: string): Promise<void> {
    const platformCommands: Record<string, string> = {
        darwin: 'open',
        win32: 'start',
        linux: 'xdg-open'
    };
    
    const openCommand = platformCommands[process.platform];
    
    if (!openCommand) {
        console.log(`\nUnsupported platform: ${process.platform}`);
        console.log(`Please open: ${filePath}`);
        return;
    }
    
    try {
        await execAsync(`${openCommand} "${filePath}"`);
    } catch (error) {
        console.error(`\nCould not open browser automatically:`, error);
        console.log(`Please open: ${filePath}`);
    }
}

async function main() {
    try {
        // Get and validate CLI arguments
        const filePath = getAndValidateArgs();
        
        // Analyze file to get words
        const vocabularyFrequencies = await analyzeFile(filePath);
        
        // Display top words
        displayTopWords(vocabularyFrequencies);
        
        // Translate words if API key is provided
        const wordsWithTranslations = await translateWords(
            vocabularyFrequencies,
            process.env.OPENAI_API_KEY
        );
        
        // Save vocabulary files
        saveVocabularyFiles(wordsWithTranslations, vocabularyFrequencies);
        
        // Generate practice file
        const htmlPath = generatePracticeFile(wordsWithTranslations);
        
        console.log('\nAnalysis complete.');
        console.log(`Practice HTML: ${htmlPath}`);
        
        // Open file in browser
        openFile(htmlPath);
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
