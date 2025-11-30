import fs from 'fs';
import path from 'path';
import { WordFrequency } from './constants';

export class FileWriter {
    private outputDir: string;
    
    constructor(outputDir: string = 'output') {
        this.outputDir = outputDir;
        this.ensureDirectoryExists(outputDir);
    }
    
    private ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
    
    private getFullPath(filename: string, subfolder?: string): string {
        const dir = subfolder ? path.join(this.outputDir, subfolder) : this.outputDir;
        this.ensureDirectoryExists(dir);
        return path.join(dir, filename);
    }
    
    saveWordList(words: WordFrequency[], filename: string, subfolder?: string): void {
        const filePath = this.getFullPath(filename, subfolder);
        const content = words
            .map(({ word, count }) => `${word}\t${count}`)
            .join('\n');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Saved ${words.length} unique words to ${filePath}`);
    }
    
    saveAsCSV(words: WordFrequency[] | Array<WordFrequency & { english?: string; description?: string }>, filename: string, subfolder?: string): void {
        const filePath = this.getFullPath(filename, subfolder);
        
        // Check if words have translation data
        const hasTranslations = words.length > 0 && 'english' in words[0];
        
        let header: string;
        let content: string;
        
        if (hasTranslations) {
            header = 'Word,English,Description,Frequency\n';
            content = words
                .map((word: any) => {
                    const escapedWord = `"${word.word.replace(/"/g, '""')}"`;
                    const escapedEnglish = `"${(word.english || '').replace(/"/g, '""')}"`;
                    const escapedDescription = `"${(word.description || '').replace(/"/g, '""')}"`;
                    return `${escapedWord},${escapedEnglish},${escapedDescription},${word.count}`;
                })
                .join('\n');
        } else {
            header = 'Word,Frequency\n';
            content = words
                .map(({ word, count }) => `"${word.replace(/"/g, '""')}",${count}`)
                .join('\n');
        }
        
        fs.writeFileSync(filePath, header + content, 'utf8');
        console.log(`Saved CSV format to ${filePath}`);
    }
    
    saveAsJSON(words: WordFrequency[], filename: string, subfolder?: string): void {
        const filePath = this.getFullPath(filename, subfolder);
        const json = JSON.stringify(words, null, 2);
        fs.writeFileSync(filePath, json, 'utf8');
        console.log(`Saved JSON format to ${filePath}`);
    }
    
    saveTextFile(content: string, filename: string, subfolder?: string): void {
        const filePath = this.getFullPath(filename, subfolder);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Saved text file to ${filePath}`);
    }
}

