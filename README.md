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
│   └── server.ts         # Local web server
├── template/
│   └── korean-practice-template.html  # Interactive practice sheet
├── output/               # Generated CSV files
└── index.ts              # Main entry point
```

## Usage

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

## Requirements

- Node.js v20+
- TypeScript
- PDF file path (provided as command line argument)

## Installation

```bash
npm install
```
