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

        console.log(`\nFixing and translating ${words.length} Korean words (single batch request)...`);
        
        try {
            const koreanWords = words.map(w => w.word).join(', ');
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
            return this.parseTranslationsResponse(content);
        } catch (error) {
            console.error('Error fixing and translating words:', error);
            return new Map();
        }
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
            
            const fixedCount = translations.filter(t => t.original).length;
            if (fixedCount > 0) {
                console.log(`Fixed/split ${fixedCount} words and added them to translations.`);
            }
            
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
                    
                    // Use the fixed/split word as the key
                    translationMap.set(t.korean, translation);
                    cache.saveTranslation(t.korean, translation);
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
