# Korean PDF Analysis Tool

A TypeScript tool for extracting and analyzing Korean text from PDF files, with special focus on vocabulary extraction and interactive practice sheets.

## Features

- Extract Korean text from PDF files
- Identify and extract vocabulary sections
- Tokenize Korean words and count frequencies
- Export results as CSV files
- Generate interactive HTML practice sheets
- Local web server for viewing practice templates

## Project Structure

```
korean_analysis/
├── src/
│   ├── constants.ts      # Constants and type definitions
│   ├── tokenizer.ts      # Korean text tokenization
│   ├── vocabulary.ts     # Vocabulary section extraction
│   ├── fileWriter.ts     # File writing utilities
│   ├── translator.ts     # ChatGPT API integration
│   ├── server.ts         # Local web server
│   └── startServer.ts    # Standalone server script
├── template/
│   └── korean-practice-template.html  # Interactive practice sheet
├── output/               # Generated CSV files
└── index.ts              # Main entry point
```

## Usage

### Full Analysis (PDF → CSV → Template)

```bash
npm start <pdf-file-path>
```

Example:
```bash
npm start /path/to/korean.pdf
```

The tool will:
1. Extract vocabulary from the PDF
2. Generate CSV files in the `output/` directory
3. Start a local web server
4. Automatically open the practice template in your browser

### View Template Only (Use Existing CSV)

If you already have CSV files in the `output/` directory and just want to view the template:

```bash
npm run server
```

This will start the web server and open the template without generating new files.

Press `Ctrl+C` to stop the server when done.

## Output Files

All output files are saved to the `output/` directory:

- `korean_vocabulary.csv` - Vocabulary words extracted from vocabulary sections
- `korean_words.csv` - All Korean words from the entire PDF

## Practice Template

The interactive HTML practice template (`template/korean-practice-template.html`) automatically:
- Loads vocabulary from the CSV file
- Displays practice sheets with Korean words
- Generates randomized drill exercises
- Updates the date automatically

The template is served via a local web server at `http://localhost:8080` to avoid CORS issues.

## Modules

### `src/constants.ts`
- Korean character regex patterns
- Korean particles list
- Type definitions (WordFrequency, VocabularySection)

### `src/tokenizer.ts`
- `tokenizeKorean()` - Extract and tokenize Korean words
- `separateParticles()` - Separate particles from base words
- `countWordFrequencies()` - Count word occurrences
- `cleanWord()` - Clean Korean words

### `src/vocabulary.ts`
- `extractVocabularySections()` - Identify and extract vocabulary sections from PDF

### `src/fileWriter.ts`
- `FileWriter` class - Handles all file output operations

### `src/server.ts`
- `startServer()` - Starts local HTTP server for serving template and CSV files

### `src/startServer.ts`
- Standalone script to run the server without generating new files
- Use with `npm run server` command

### `src/translator.ts`
- `Translator` class - Handles ChatGPT API integration for translations
- `translateWords()` - Fixes, splits, and translates words in a single API call
- Automatically fixes concatenated/misspelled words and splits combined words
- Uses cache to avoid re-translating words

### `src/cache.ts`
- `CacheInterface` - Interface for cache implementations
- `FileBasedCache` - Default file-based cache implementation
- `getCache()` / `setCache()` - Get or swap cache implementation
- Caches translations and PDF text for faster subsequent runs

## Requirements

- Node.js v20+
- TypeScript
- PDF file path (provided as command line argument)
- OpenAI API key (optional, for automatic translations)

## Installation

```bash
npm install
```

## Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_api_key_here
```

You can get an API key from [OpenAI Platform](https://platform.openai.com/api-keys).

**Note:** If you don't provide an API key, the tool will still work but will generate CSV files without English translations and descriptions. The practice template will show "missing english" and "missing description" for those fields.

### Automatic Translation

When an OpenAI API key is provided, the tool will automatically:
- Fix and split concatenated/misspelled Korean words (e.g., "분위기 기분이" → ["분위기", "기분"])
- Translate Korean words to English (batch processing - all words in one API call)
- Generate pronunciation guides (romanization)
- Create example sentences in Korean with English translations

The translation uses efficient batch processing - word fixing, splitting, and translation all happen in a single API request for faster execution and lower cost. Fixed/split words are automatically added to the vocabulary list.

Example output in CSV:
```
Word,English,Description,Frequency
가방,bag,"ga-bang, 이 가방이 마음에 들어요. (I like this bag.)",5
```

## Caching

The tool uses a file-based cache to improve performance:

- **Translation Cache**: Stores translations in `.cache/translations.json`
  - Avoids re-translating the same words across different PDFs
  - Saves API costs and speeds up processing
  - Automatically checks cache before making API calls

The cache is automatically created and managed. To clear the cache, delete the `.cache/` directory.

The cache implementation is modular - you can swap it with a different implementation (e.g., Redis, database) by implementing the `CacheInterface` in `src/cache.ts`.

## Security

- `.env` file is excluded from git (see `.gitignore`)
- Never commit your API keys
- The `.env.example` file is safe to commit (contains no secrets)
- Cache directory is excluded from git
