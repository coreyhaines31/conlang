/**
 * Seeded RNG for deterministic word generation
 * Uses a simple Linear Congruential Generator (LCG)
 */
export class SeededRNG {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    // LCG parameters (same as used in many standard libraries)
    this.seed = (this.seed * 1664525 + 1013904223) % Math.pow(2, 32)
    return (this.seed >>> 0) / Math.pow(2, 32)
  }

  /**
   * Generate random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min
  }

  /**
   * Pick random element from array
   */
  pick<T>(array: T[]): T {
    if (array.length === 0) throw new Error('Cannot pick from empty array')
    return array[this.nextInt(0, array.length)]
  }

  /**
   * Shuffle array deterministically (Fisher-Yates)
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1)
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }
}

export interface Phonology {
  consonants: string[]
  vowels: string[]
}

export interface Phonotactics {
  syllableTemplates: string[] // e.g., ['CV', 'CVC', 'V']
  forbiddenSequences: string[] // e.g., ['kk', 'vv']
}

export interface Orthography {
  mappings: Record<string, string> // phoneme -> grapheme
}

export interface LanguageDefinition {
  phonology?: Phonology
  phonotactics?: Phonotactics
  orthography?: Orthography
}

/**
 * Check if a word contains forbidden sequences
 */
function hasForbiddenSequence(word: string, forbidden: string[]): boolean {
  return forbidden.some(seq => word.includes(seq))
}

/**
 * Generate a single word based on phonology and phonotactics
 */
function generateWord(
  rng: SeededRNG,
  phonology: Phonology,
  phonotactics: Phonotactics
): string {
  const { consonants, vowels } = phonology
  const { syllableTemplates, forbiddenSequences } = phonotactics

  if (syllableTemplates.length === 0) {
    throw new Error('No syllable templates defined')
  }

  let word = ''
  let attempts = 0
  const maxAttempts = 100

  // Generate 1-3 syllables
  const syllableCount = rng.nextInt(1, 4)

  for (let i = 0; i < syllableCount; i++) {
    const template = rng.pick(syllableTemplates)
    let syllable = ''

    for (const char of template) {
      if (char === 'C') {
        syllable += rng.pick(consonants)
      } else if (char === 'V') {
        syllable += rng.pick(vowels)
      } else {
        syllable += char
      }
    }

    word += syllable
  }

  // Check for forbidden sequences
  if (hasForbiddenSequence(word, forbiddenSequences)) {
    attempts++
    if (attempts < maxAttempts) {
      return generateWord(rng, phonology, phonotactics)
    }
  }

  return word
}

/**
 * Apply orthography mapping to convert phonemic form to orthographic form
 */
function applyOrthography(phonemic: string, orthography?: Orthography): string {
  if (!orthography || !orthography.mappings) {
    return phonemic
  }

  let result = phonemic
  const mappings = orthography.mappings

  // Sort by length (longest first) to handle multi-character mappings
  const sortedKeys = Object.keys(mappings).sort((a, b) => b.length - a.length)

  for (const phoneme of sortedKeys) {
    const grapheme = mappings[phoneme]
    result = result.replace(new RegExp(phoneme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), grapheme)
  }

  return result
}

/**
 * Generate multiple words deterministically
 */
export function generateWords(
  seed: number,
  count: number,
  definition: LanguageDefinition
): Array<{ phonemic: string; orthographic: string }> {
  const rng = new SeededRNG(seed)
  const words: Array<{ phonemic: string; orthographic: string }> = []

  const phonology = definition.phonology || {
    consonants: ['p', 't', 'k', 'b', 'd', 'g', 'm', 'n', 's', 'l', 'r'],
    vowels: ['a', 'e', 'i', 'o', 'u'],
  }

  const phonotactics = definition.phonotactics || {
    syllableTemplates: ['CV', 'CVC'],
    forbiddenSequences: [],
  }

  for (let i = 0; i < count; i++) {
    const phonemic = generateWord(rng, phonology, phonotactics)
    const orthographic = applyOrthography(phonemic, definition.orthography)
    words.push({ phonemic, orthographic })
  }

  return words
}

