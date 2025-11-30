import fs from 'fs';
import path from 'path';

export interface TranslationCache {
    english: string;
    description: string;
    cachedAt: string;
}

export interface CacheInterface {
    getTranslation(word: string): TranslationCache | null;
    saveTranslation(word: string, translation: TranslationCache): void;
    clearCache(): void;
}

class FileBasedCache implements CacheInterface {
    private cacheDir: string;
    private translationsFile: string;
    private translations: Map<string, TranslationCache>;

    constructor(cacheDir: string = '.cache') {
        this.cacheDir = cacheDir;
        this.translationsFile = path.join(cacheDir, 'translations.json');
        this.translations = new Map();

        // Ensure cache directory exists
        this.ensureCacheDirectory();

        // Load existing translations
        this.loadTranslations();
    }

    private ensureCacheDirectory(): void {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    private loadTranslations(): void {
        try {
            if (fs.existsSync(this.translationsFile)) {
                const content = fs.readFileSync(this.translationsFile, 'utf8');
                const data = JSON.parse(content);
                Object.entries(data).forEach(([word, translation]) => {
                    this.translations.set(word, translation as TranslationCache);
                });
            }
        } catch (error) {
            console.log('Could not load translation cache:', error);
        }
    }

    private saveTranslations(): void {
        try {
            const data: Record<string, TranslationCache> = {};
            this.translations.forEach((translation, word) => {
                data[word] = translation;
            });
            fs.writeFileSync(this.translationsFile, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error('Could not save translation cache:', error);
        }
    }

    getTranslation(word: string): TranslationCache | null {
        return this.translations.get(word) || null;
    }

    saveTranslation(word: string, translation: TranslationCache): void {
        this.translations.set(word, translation);
        this.saveTranslations();
    }

    clearCache(): void {
        try {
            // Clear translations
            this.translations.clear();
            if (fs.existsSync(this.translationsFile)) {
                fs.unlinkSync(this.translationsFile);
            }
        } catch (error) {
            console.error('Could not clear cache:', error);
        }
    }
}

// Export singleton instance (can be swapped with different implementation)
let cacheInstance: CacheInterface = new FileBasedCache();

export function getCache(): CacheInterface {
    return cacheInstance;
}

export function setCache(cache: CacheInterface): void {
    cacheInstance = cache;
}

export { FileBasedCache };

