import OpenAI from 'openai';
import { WordFrequency } from './constants';

interface WordWithTranslation extends WordFrequency {
    english?: string;
    description?: string;
}

export class Translator {
    private client: OpenAI | null = null;

    constructor(apiKey?: string) {
        if (apiKey) {
            this.client = new OpenAI({ apiKey });
        }
    }

    async translateWords(words: WordFrequency[]): Promise<WordWithTranslation[]> {
        if (!this.client) {
            console.log('OpenAI API key not provided. Skipping translations.');
            return words.map(w => ({ ...w, english: 'missing english', description: 'missing description' }));
        }

        if (words.length === 0) {
            return [];
        }

        console.log(`\nTranslating ${words.length} words using ChatGPT API (batch request)...`);

        try {
            // Create a list of Korean words
            const koreanWords = words.map(w => w.word).join(', ');

            const prompt = `Translate the following Korean words to English. For each word, provide:
1. English translation (just the word/phrase)
2. Pronunciation in romanization (e.g., ga-bang)
3. A simple example sentence in Korean with English translation in parentheses

Korean words: ${koreanWords}

Return a JSON object with a "translations" array. Each object in the array should have:
- korean: the Korean word
- english: English translation
- pronunciation: romanized pronunciation
- example: example sentence in format "Korean sentence (English translation)"

Example format:
{
  "translations": [
    {
      "korean": "가방",
      "english": "bag",
      "pronunciation": "ga-bang",
      "example": "이 가방이 마음에 들어요. (I like this bag.)"
    }
  ]
}

Return ONLY valid JSON, no other text.`;

            const response = await this.client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful Korean language teacher. Provide clear, concise translations and example sentences. Always return valid JSON with a "translations" array.'
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
            
            // Try to parse JSON response
            let translations: any[] = [];
            try {
                const parsed = JSON.parse(content);
                // Handle both array and object with array property
                if (Array.isArray(parsed)) {
                    translations = parsed;
                } else if (parsed.translations && Array.isArray(parsed.translations)) {
                    translations = parsed.translations;
                } else if (parsed.words && Array.isArray(parsed.words)) {
                    translations = parsed.words;
                } else {
                    console.error('Unexpected JSON structure:', Object.keys(parsed));
                }
            } catch (parseError) {
                console.error('Failed to parse JSON response:', parseError);
                console.error('Response content:', content.substring(0, 200));
                // Return words with missing translations on parse error
                return words.map(w => ({ ...w, english: 'missing english', description: 'missing description' }));
            }

            // Create a map for quick lookup
            const translationMap = new Map<string, { english: string; description: string }>();
            translations.forEach((t: any) => {
                if (t.korean) {
                    const pronunciation = t.pronunciation || '';
                    const example = t.example || '';
                    const description = [pronunciation, example].filter(Boolean).join(', ') || 'missing description';
                    translationMap.set(t.korean, {
                        english: t.english || 'missing english',
                        description: description
                    });
                }
            });

            // Map words to translations
            const results: WordWithTranslation[] = words.map(word => {
                const translation = translationMap.get(word.word);
                return {
                    ...word,
                    english: translation?.english || 'missing english',
                    description: translation?.description || 'missing description'
                };
            });

            console.log(`Translation complete. Translated ${results.filter(r => r.english !== 'missing english').length}/${words.length} words.`);
            return results;

        } catch (error) {
            console.error('Error translating words:', error);
            // Return words with missing translations on error
            return words.map(w => ({ ...w, english: 'missing english', description: 'missing description' }));
        }
    }
}

