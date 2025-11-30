import OpenAI from 'openai';
import { WordFrequency } from './constants';
import { getCache, TranslationCache } from './cache';

interface WordWithTranslation extends WordFrequency {
    english?: string;
    description?: string;
}

// Prompt template - combines word fixing and translation
const FIX_AND_TRANSLATE_PROMPT_TEMPLATE = `Fix, split, and translate the following Korean words. Some words may be:
1. Two words concatenated together (e.g., "분위기기분이" should be split into ["분위기", "기분"])
2. Two words with a space (e.g., "분위기 기분이" should be split into ["분위기", "기분"])
3. Misspelled or contain errors (fix the spelling)
4. Correct as-is

IMPORTANT: 
- If a word contains two separate Korean words (either concatenated or with spaces), split them into separate words
- Translate ALL words: both original words AND any fixed/split words
- If you fix or split a word, add the fixed/split words to the translations list

Korean words: {WORDS}

Return a JSON object with a "translations" array. Each object should have:
- korean: the Korean word (use fixed/split words if applicable)
- english: English translation
- pronunciation: romanized pronunciation
- example: example sentence in format "Korean sentence (English translation)"
- original: (optional) the original word if this was fixed/split

Example format:
{
  "translations": [
    {
      "korean": "분위기",
      "english": "atmosphere",
      "pronunciation": "bun-wi-gi",
      "example": "이 카페의 분위기가 좋아요. (The atmosphere of this cafe is nice.)",
      "original": "분위기 기분이"
    },
    {
      "korean": "기분",
      "english": "mood",
      "pronunciation": "gi-bun",
      "example": "기분이 좋아요. (I'm in a good mood.)",
      "original": "분위기 기분이"
    },
    {
      "korean": "가방",
      "english": "bag",
      "pronunciation": "ga-bang",
      "example": "이 가방이 마음에 들어요. (I like this bag.)"
    }
  ]
}

Return ONLY valid JSON, no other text.`;

const FIX_AND_TRANSLATE_SYSTEM_MESSAGE = 'You are a Korean language expert and teacher. Fix concatenated or misspelled Korean words, split combined words, and provide translations. Return only valid JSON with a "translations" array.';

export class Translator {
    private client: OpenAI | null = null;

    constructor(apiKey?: string) {
        if (apiKey) {
            this.client = new OpenAI({ apiKey });
        }
    }

    /**
     * Fix, split, and translate words in a single API call
     */
    private async fixAndTranslateWords(words: WordFrequency[]): Promise<Map<string, TranslationCache>> {
        if (!this.client || words.length === 0) {
            return new Map();
        }

        const BATCH_SIZE = 100; // Process in batches to avoid timeouts
        const translationMap = new Map<string, TranslationCache>();
        
        // Process words in batches
        for (let i = 0; i < words.length; i += BATCH_SIZE) {
            const batch = words.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(words.length / BATCH_SIZE);
            
            console.log(`\nFixing and translating batch ${batchNum}/${totalBatches} (${batch.length} words)...`);
            
            try {
                const koreanWords = batch.map(w => w.word).join(', ');
                const prompt = FIX_AND_TRANSLATE_PROMPT_TEMPLATE.replace('{WORDS}', koreanWords);

                const response = await this.client.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: FIX_AND_TRANSLATE_SYSTEM_MESSAGE
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    response_format: { type: 'json_object' }
                });

                const content = response.choices[0]?.message?.content || '';
                const batchResults = this.parseTranslationsResponse(content);
                
                // Merge batch results into main map
                batchResults.forEach((translation, word) => {
                    translationMap.set(word, translation);
                });
                
                console.log(`Batch ${batchNum} complete.`);
            } catch (error) {
                console.error(`Error fixing and translating batch ${batchNum}:`, error);
                // Continue with next batch even if this one fails
            }
        }
        
        return translationMap;
    }

    /**
     * Parse the translations response from ChatGPT
     * Returns a map of Korean word -> translation, including fixed/split words
     */
    private parseTranslationsResponse(content: string): Map<string, TranslationCache> {
        const translationMap = new Map<string, TranslationCache>();
        const cache = getCache();
        
        try {
            const parsed = JSON.parse(content);
            let translations: any[] = [];
            
            if (Array.isArray(parsed)) {
                translations = parsed;
            } else if (parsed.translations && Array.isArray(parsed.translations)) {
                translations = parsed.translations;
            } else if (parsed.words && Array.isArray(parsed.words)) {
                translations = parsed.words;
            }
            
            // First pass: cache all fixed/split words
            translations.forEach((t: any) => {
                if (t.korean) {
                    const pronunciation = t.pronunciation || '';
                    const example = t.example || '';
                    const description = [pronunciation, example].filter(Boolean).join(', ') || 'missing description';
                    const translation: TranslationCache = {
                        english: t.english || 'missing english',
                        description: description,
                        cachedAt: new Date().toISOString()
                    };
                    
                    // Cache the fixed/split word
                    translationMap.set(t.korean, translation);
                    cache.saveTranslation(t.korean, translation);
                }
            });
            
            // Second pass: cache original words (grouped by original to handle splits)
            const originalWordMap = new Map<string, any[]>();
            translations.forEach((t: any) => {
                if (t.original && t.original !== t.korean) {
                    const original = t.original;
                    if (!originalWordMap.has(original)) {
                        originalWordMap.set(original, []);
                    }
                    originalWordMap.get(original)!.push(t);
                }
            });
            
            const fixedCount = originalWordMap.size;
            if (fixedCount > 0) {
                console.log(`Fixed/split ${fixedCount} words and added them to translations.`);
            }
            
            // Cache original words with combined translations for split words
            originalWordMap.forEach((splitWords, original) => {
                if (splitWords.length > 1) {
                    // Multiple words: combine translations
                    const combinedDescription = splitWords
                        .map((sw: any) => {
                            const p = sw.pronunciation || '';
                            const e = sw.example || '';
                            return [p, e].filter(Boolean).join(', ');
                        })
                        .filter(Boolean)
                        .join('; ') || 'missing description';
                    
                    const combinedTranslation: TranslationCache = {
                        english: splitWords.map((sw: any) => sw.english).filter(Boolean).join(' / ') || 'missing english',
                        description: combinedDescription,
                        cachedAt: new Date().toISOString()
                    };
                    cache.saveTranslation(original, combinedTranslation);
                } else if (splitWords.length === 1) {
                    // Single fixed word: use its translation
                    const sw = splitWords[0];
                    const pronunciation = sw.pronunciation || '';
                    const example = sw.example || '';
                    const description = [pronunciation, example].filter(Boolean).join(', ') || 'missing description';
                    const translation: TranslationCache = {
                        english: sw.english || 'missing english',
                        description: description,
                        cachedAt: new Date().toISOString()
                    };
                    cache.saveTranslation(original, translation);
                }
            });
        } catch (parseError) {
            console.error('Failed to parse translation response:', parseError);
            console.error('Response content:', content.substring(0, 200));
        }
        
        return translationMap;
    }

    /**
     * Main translation method: fixes/splits words and translates in one API call, with caching
     */
    async translateWords(words: WordFrequency[]): Promise<WordWithTranslation[]> {
        if (!this.client) {
            console.log('OpenAI API key not provided. Skipping translations.');
            return words.map(w => ({ ...w, english: 'missing english', description: 'missing description' }));
        }

        if (words.length === 0) {
            return [];
        }

        // Step 1: Check cache for existing translations
        const cache = getCache();
        const cachedResults = new Map<string, TranslationCache>();
        const wordsToProcess: WordFrequency[] = [];
        
        words.forEach(word => {
            const cached = cache.getTranslation(word.word);
            if (cached) {
                cachedResults.set(word.word, cached);
            } else {
                wordsToProcess.push(word);
            }
        });

        const cachedCount = cachedResults.size;
        if (cachedCount > 0) {
            console.log(`\nFound ${cachedCount}/${words.length} words in cache.`);
        }

        // Step 2: Fix and translate words not in cache (single API call)
        let newTranslations = new Map<string, TranslationCache>();
        if (wordsToProcess.length > 0) {
            newTranslations = await this.fixAndTranslateWords(wordsToProcess);
        }

        // Step 3: Combine cached and new translations
        const allTranslations = new Map([...cachedResults, ...newTranslations]);

        // Step 4: Build results - include both original words and any fixed/split words from new translations
        const results: WordWithTranslation[] = [];
        
        // Add cached original words
        words.forEach(word => {
            const translation = cachedResults.get(word.word);
            if (translation) {
                results.push({
                    ...word,
                    english: translation.english,
                    description: translation.description
                });
            }
        });
        
        // Add new translations (which may include fixed/split words)
        newTranslations.forEach((translation, koreanWord) => {
            // Check if this is a fixed/split word (not in original list)
            const isOriginalWord = words.some(w => w.word === koreanWord);
            if (!isOriginalWord) {
                // This is a fixed/split word, add it with count from first occurrence
                const firstWord = words[0];
                results.push({
                    word: koreanWord,
                    count: firstWord.count,
                    english: translation.english,
                    description: translation.description
                });
            } else {
                // This is an original word, add it if not already added from cache
                const existing = results.find(r => r.word === koreanWord);
                if (!existing) {
                    const originalWord = words.find(w => w.word === koreanWord);
                    if (originalWord) {
                        results.push({
                            ...originalWord,
                            english: translation.english,
                            description: translation.description
                        });
                    }
                }
            }
        });

        const translatedCount = results.filter(r => r.english !== 'missing english').length;
        console.log(`Translation complete. ${translatedCount} words translated (${cachedCount} from cache, ${wordsToProcess.length} processed, ${newTranslations.size - wordsToProcess.length} fixed/split words added).`);
        
        return results;
    }
}
