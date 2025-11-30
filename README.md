# Korean PDF Analysis Tool

A TypeScript tool for extracting and analyzing Korean text from PDF files, with special focus on vocabulary extraction.

## Features

- Extract Korean text from PDF files
- Identify and extract vocabulary sections
- Tokenize Korean words and count frequencies
- Export results as CSV files

## Project Structure

```
korean_analysis/
├── src/
│   ├── constants.ts      # Constants and type definitions
│   ├── tokenizer.ts      # Korean text tokenization
│   ├── vocabulary.ts     # Vocabulary section extraction
│   └── fileWriter.ts     # File writing utilities
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

## Output Files

All output files are saved to the `output/` directory:

- `korean_vocabulary.csv` - Vocabulary words extracted from vocabulary sections
- `korean_words.csv` - All Korean words from the entire PDF

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

## Requirements

- Node.js v20+
- TypeScript
- PDF file path (provided as command line argument)

## Installation

```bash
npm install
```

