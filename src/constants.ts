// Korean character range: \uAC00-\uD7A3 (Hangul syllables)
// Also includes: \u1100-\u11FF (Hangul Jamo), \u3130-\u318F (Hangul Compatibility Jamo)
export const KOREAN_REGEX = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]+/g;

// Common Korean particles (조사) that attach to nouns
export const KOREAN_PARTICLES = [
    '이', '가', '을', '를', '에', '에서', '와', '과', '의', '로', '으로',
    '도', '만', '부터', '까지', '에게', '께', '한테', '께서', '보다', '처럼'
];

export interface WordFrequency {
    word: string;
    count: number;
}

export interface VocabularySection {
    title: string;
    words: string[];
}

