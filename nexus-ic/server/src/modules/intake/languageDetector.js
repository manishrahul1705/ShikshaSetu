/**
 * N67 (Addition): Multilingual complaint language detector.
 *
 * Uses Unicode script detection to identify the script/language
 * of complaint text. No cloud translation service.
 * Original text is never modified.
 *
 * Supports: Devanagari (Hindi/Marathi/Sanskrit), Tamil, Telugu, Kannada,
 * Malayalam, Bengali, Gujarati, Odia, Gurmukhi (Punjabi), Latin (English).
 */

/**
 * Unicode script ranges for Indian languages.
 */
const SCRIPT_RANGES = [
  { name: 'Devanagari', tag: 'hi', start: 0x0900, end: 0x097f },
  { name: 'Bengali', tag: 'bn', start: 0x0980, end: 0x09ff },
  { name: 'Gurmukhi', tag: 'pa', start: 0x0a00, end: 0x0a7f },
  { name: 'Gujarati', tag: 'gu', start: 0x0a80, end: 0x0aff },
  { name: 'Odia', tag: 'or', start: 0x0b00, end: 0x0b7f },
  { name: 'Tamil', tag: 'ta', start: 0x0b80, end: 0x0bff },
  { name: 'Telugu', tag: 'te', start: 0x0c00, end: 0x0c7f },
  { name: 'Kannada', tag: 'kn', start: 0x0c80, end: 0x0cff },
  { name: 'Malayalam', tag: 'ml', start: 0x0d00, end: 0x0d7f },
];

/**
 * Detect the predominant script/language in a text.
 * Returns a language tag (e.g., 'hi', 'ta', 'en').
 *
 * @param {string} text
 * @returns {{ tag: string, script: string, confidence: number }}
 */
export function detect(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { tag: 'und', script: 'Unknown', confidence: 0 };
  }

  const counts = {};
  let total = 0;

  for (const char of text) {
    const code = char.codePointAt(0);

    // Skip whitespace, digits, punctuation
    if (code <= 0x007f) {
      // ASCII
      if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
        counts['Latin'] = (counts['Latin'] || 0) + 1;
        total++;
      }
      continue;
    }

    for (const range of SCRIPT_RANGES) {
      if (code >= range.start && code <= range.end) {
        counts[range.name] = (counts[range.name] || 0) + 1;
        total++;
        break;
      }
    }
  }

  if (total === 0) {
    return { tag: 'und', script: 'Unknown', confidence: 0 };
  }

  // Find the dominant script
  let maxScript = 'Latin';
  let maxCount = counts['Latin'] || 0;

  for (const [script, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxScript = script;
      maxCount = count;
    }
  }

  const confidence = Math.round((maxCount / total) * 100);

  if (maxScript === 'Latin') {
    return { tag: 'en', script: 'Latin', confidence };
  }

  const range = SCRIPT_RANGES.find((r) => r.name === maxScript);
  return {
    tag: range ? range.tag : 'und',
    script: maxScript,
    confidence,
  };
}
