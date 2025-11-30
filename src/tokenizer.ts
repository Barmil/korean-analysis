import { KOREAN_REGEX, KOREAN_PARTICLES } from './constants';

export function cleanWord(word: string): string {
    // Remove special characters that might be mixed in
    return word.replace(/[^\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/g, '');
}

export function separateParticles(word: string): string[] {
    const words: string[] = [];
    
    // Try to separate common particles
    for (const particle of KOREAN_PARTICLES) {
        if (word.endsWith(particle) && word.length > particle.length) {
            const baseWord = word.slice(0, -particle.length);
            if (baseWord.length >= 2) {
                words.push(baseWord);
            }
            return words;
        }
    }
    
    // If no particle found, return the word as-is
    if (word.length >= 2) {
        words.push(word);
    }
    
    return words;
}

export function tokenizeKorean(text: string): string[] {
    // Extract all Korean words
    const koreanWords = text.match(KOREAN_REGEX) || [];
    
    // Separate particles and filter
    const tokens: string[] = [];
    koreanWords.forEach(word => {
        // Clean the word first
        const cleaned = cleanWord(word);
        if (cleaned.length < 2) return;
        
        const separated = separateParticles(cleaned);
        tokens.push(...separated);
    });
    
    return tokens;
}

export function countWordFrequencies(words: string[]): import('./constants').WordFrequency[] {
    const frequencyMap = new Map<string, number>();
    
    words.forEach(word => {
        const count = frequencyMap.get(word) || 0;
        frequencyMap.set(word, count + 1);
    });
    
    // Convert to array and sort by frequency (descending)
    return Array.from(frequencyMap.entries())
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count);
}

