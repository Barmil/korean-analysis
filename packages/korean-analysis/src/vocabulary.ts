import { KOREAN_REGEX, VocabularySection } from './constants';
import { cleanWord } from './tokenizer';

export function extractVocabularySections(text: string): VocabularySection[] {
    const sections: VocabularySection[] = [];
    const lines = text.split('\n');
    
    // More specific patterns for vocabulary section headers
    const vocabularyHeaderPatterns = [
        /^[\s●]*어휘\s*Vocabulary/i,
        /^[\s●]*Vocabulary[\s]*$/i,
        /^[\s●]*관람\s*Watching/i,
        /^[\s●]*감상\s*Appreciation/i,
        /Watching\s*related\s*vocabulary/i,
        /Appreciation\s*related\s*vocabulary/i
    ];
    
    // Patterns that indicate we should stop collecting (next major section)
    const stopPatterns = [
        /^[\s●]*문법/i,
        /^[\s●]*Grammar/i,
        /^[\s●]*PART\s*\d+/i,
        /^[\s●]*Part\s*\d+/i,
        /^[\s●]*듣기/i,
        /^[\s●]*Listening/i,
        /^[\s●]*읽기/i,
        /^[\s●]*Reading/i,
        /^[\s●]*쓰기/i,
        /^[\s●]*Writing/i,
        /^[\s●]*말하기/i,
        /^[\s●]*Speaking/i
    ];
    
    let currentSection: VocabularySection | null = null;
    let inVocabularySection = false;
    let linesSinceMarker = 0;
    let emptyLinesCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Check if this line is a vocabulary section header
        const isHeader = vocabularyHeaderPatterns.some(pattern => pattern.test(trimmedLine));
        
        if (isHeader) {
            // Save previous section if exists
            if (currentSection && currentSection.words.length > 0) {
                sections.push(currentSection);
            }
            
            // Start new section
            currentSection = {
                title: trimmedLine.substring(0, 50),
                words: []
            };
            inVocabularySection = true;
            linesSinceMarker = 0;
            emptyLinesCount = 0;
            continue;
        }
        
        // Check if we should stop collecting
        const shouldStop = stopPatterns.some(pattern => pattern.test(trimmedLine));
        if (shouldStop && inVocabularySection) {
            if (currentSection && currentSection.words.length > 0) {
                sections.push(currentSection);
            }
            currentSection = null;
            inVocabularySection = false;
            continue;
        }
        
        // If we're in a vocabulary section, collect words
        if (inVocabularySection && currentSection) {
            // Skip empty lines, but count them
            if (trimmedLine.length === 0) {
                emptyLinesCount++;
                // If too many empty lines, might be end of section
                if (emptyLinesCount > 3) {
                    if (currentSection.words.length > 0) {
                        sections.push(currentSection);
                    }
                    currentSection = null;
                    inVocabularySection = false;
                }
                continue;
            }
            
            emptyLinesCount = 0;
            
            // Look for vocabulary items - typically start with bullet points or are short definitions
            const hasBullet = /^[\s●•·\-]/.test(trimmedLine);
            const hasKoreanWord = KOREAN_REGEX.test(trimmedLine);
            
            if (hasKoreanWord) {
                const koreanWords = trimmedLine.match(KOREAN_REGEX) || [];
                
                if (hasBullet && koreanWords.length > 0 && koreanWords[0]) {
                    // Bulleted lines: take the first Korean word as the vocabulary item
                    const firstWord = koreanWords[0];
                    const cleaned = cleanWord(firstWord);
                    
                    if (cleaned.length >= 2 && cleaned.length <= 15) {
                        currentSection!.words.push(cleaned);
                    }
                } else if (linesSinceMarker < 15) {
                    // Lines without bullets but close to header: look for vocabulary patterns
                    if (koreanWords.length >= 1 && koreanWords.length <= 4) {
                        // Take the first word(s) as potential vocabulary
                        koreanWords.slice(0, 2).forEach(word => {
                            const cleaned = cleanWord(word);
                            // Vocabulary words are typically 2-10 characters
                            if (cleaned.length >= 2 && cleaned.length <= 10) {
                                currentSection!.words.push(cleaned);
                            }
                        });
                    }
                }
            }
            
            linesSinceMarker++;
            
            // Stop collecting after reasonable number of lines
            if (linesSinceMarker > 25) {
                if (currentSection.words.length > 0) {
                    sections.push(currentSection);
                }
                currentSection = null;
                inVocabularySection = false;
            }
        }
    }
    
    // Save last section if exists
    if (currentSection && currentSection.words.length > 0) {
        sections.push(currentSection);
    }
    
    return sections;
}

