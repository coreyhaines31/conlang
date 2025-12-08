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
   * Pick from array with preference for certain items
   * Items in preferred array are 3x more likely to be picked
   */
  pickWithPreference<T>(array: T[], preferred: T[], avoided: T[]): T {
    if (array.length === 0) throw new Error('Cannot pick from empty array')
    
    // Filter out avoided items
    const available = array.filter(item => !avoided.includes(item))
    if (available.length === 0) return this.pick(array)
    
    // Build weighted array: preferred items get weight 3, others get weight 1
    const weighted = available.map(item => ({
      item,
      weight: preferred.includes(item) ? 3 : 1
    }))
    
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0)
    let random = this.next() * totalWeight
    
    for (const w of weighted) {
      random -= w.weight
      if (random <= 0) return w.item
    }
    
    return available[available.length - 1]
  }

  /**
   * Pick random element from weighted array
   * Each item has a weight property - higher weight = more likely to be picked
   */
  pickWeighted<T extends { weight: number }>(items: T[]): T {
    if (items.length === 0) throw new Error('Cannot pick from empty array')
    
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0)
    if (totalWeight === 0) return items[0]
    
    let random = this.next() * totalWeight
    
    for (const item of items) {
      random -= item.weight || 1
      if (random <= 0) return item
    }
    
    return items[items.length - 1]
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

export interface SyllableTemplate {
  template: string // e.g., 'CV', 'CVC', 'V'
  weight: number   // higher = more frequent
}

export interface Phonotactics {
  // Support both old format (string[]) and new format (SyllableTemplate[])
  syllableTemplates: string[] | SyllableTemplate[]
  forbiddenSequences: string[]
}

export interface Orthography {
  mappings: Record<string, string> // phoneme -> grapheme
}

/**
 * Phonological rule for sound changes
 * Applies find/replace with optional context
 */
export interface PhonologicalRule {
  id: string
  name: string
  description?: string
  find: string           // Pattern to find (can be phoneme or sequence)
  replace: string        // What to replace with
  context?: {
    before?: string[]    // Only apply if preceded by one of these
    after?: string[]     // Only apply if followed by one of these
    notBefore?: string[] // Don't apply if preceded by one of these
    notAfter?: string[]  // Don't apply if followed by one of these
    position?: 'initial' | 'medial' | 'final' // Word position
  }
  enabled: boolean
}

/**
 * Style controls for generation
 */
export interface GenerationStyle {
  preferredConsonants?: string[]  // Consonants to favor
  avoidedConsonants?: string[]    // Consonants to use less
  preferredVowels?: string[]      // Vowels to favor
  avoidedVowels?: string[]        // Vowels to use less
  commonBeginnings?: string[]     // Common word-initial patterns
  commonEndings?: string[]        // Common word-final patterns
  syllableLengthDistribution?: {  // How many syllables words should have
    1: number  // Weight for 1-syllable words
    2: number  // Weight for 2-syllable words
    3: number  // Weight for 3-syllable words
    4: number  // Weight for 4-syllable words
  }
}

/**
 * Name generator configuration
 */
export interface NameGeneratorConfig {
  type: 'person' | 'place' | 'faction'
  patterns?: string[]           // Custom patterns like "CV-CVC" or "the CVC of CVCV"
  titlePrefix?: string[]        // Titles like "Lord", "King"
  descriptorSuffix?: string[]   // Descriptors like "the Great", "of the North"
}

export interface LanguageDefinition {
  phonology?: Phonology
  phonotactics?: Phonotactics
  orthography?: Orthography
  phonologicalRules?: PhonologicalRule[]
  generationStyle?: GenerationStyle
  nameGenerators?: NameGeneratorConfig[]
}

/**
 * Normalize syllable templates to weighted format
 */
function normalizeTemplates(templates: string[] | SyllableTemplate[]): SyllableTemplate[] {
  if (templates.length === 0) return []
  
  // Check if already in weighted format
  if (typeof templates[0] === 'object' && 'template' in templates[0]) {
    return templates as SyllableTemplate[]
  }
  
  // Convert string[] to SyllableTemplate[] with equal weights
  return (templates as string[]).map(template => ({ template, weight: 1 }))
}

/**
 * Check if a word contains forbidden sequences
 */
function hasForbiddenSequence(word: string, forbidden: string[]): boolean {
  return forbidden.some(seq => word.includes(seq))
}

/**
 * Apply phonological rules to a word
 */
function applyPhonologicalRules(word: string, rules: PhonologicalRule[]): string {
  let result = word
  
  for (const rule of rules) {
    if (!rule.enabled) continue
    
    // Simple case: no context
    if (!rule.context) {
      result = result.split(rule.find).join(rule.replace)
      continue
    }
    
    // Context-sensitive replacement
    const { before, after, notBefore, notAfter, position } = rule.context
    let newResult = ''
    let i = 0
    
    while (i < result.length) {
      const remaining = result.slice(i)
      
      // Check if find pattern matches at current position
      if (!remaining.startsWith(rule.find)) {
        newResult += result[i]
        i++
        continue
      }
      
      const beforeStr = result.slice(0, i)
      const afterStr = result.slice(i + rule.find.length)
      
      let shouldReplace = true
      
      // Check position constraints
      if (position === 'initial' && i !== 0) shouldReplace = false
      if (position === 'final' && afterStr.length > 0) shouldReplace = false
      if (position === 'medial' && (i === 0 || afterStr.length === 0)) shouldReplace = false
      
      // Check before constraints
      if (before && before.length > 0) {
        const matches = before.some(b => beforeStr.endsWith(b))
        if (!matches) shouldReplace = false
      }
      
      // Check after constraints
      if (after && after.length > 0) {
        const matches = after.some(a => afterStr.startsWith(a))
        if (!matches) shouldReplace = false
      }
      
      // Check notBefore constraints
      if (notBefore && notBefore.length > 0) {
        const matches = notBefore.some(b => beforeStr.endsWith(b))
        if (matches) shouldReplace = false
      }
      
      // Check notAfter constraints
      if (notAfter && notAfter.length > 0) {
        const matches = notAfter.some(a => afterStr.startsWith(a))
        if (matches) shouldReplace = false
      }
      
      if (shouldReplace) {
        newResult += rule.replace
        i += rule.find.length
      } else {
        newResult += result[i]
        i++
      }
    }
    
    result = newResult
  }
  
  return result
}

/**
 * Get syllable count based on style distribution
 */
function getSyllableCount(rng: SeededRNG, style?: GenerationStyle): number {
  if (!style?.syllableLengthDistribution) {
    return rng.nextInt(1, 4) // Default: 1-3 syllables
  }
  
  const dist = style.syllableLengthDistribution
  const weights = [
    { count: 1, weight: dist[1] || 0 },
    { count: 2, weight: dist[2] || 0 },
    { count: 3, weight: dist[3] || 0 },
    { count: 4, weight: dist[4] || 0 },
  ].filter(w => w.weight > 0)
  
  if (weights.length === 0) return rng.nextInt(1, 4)
  
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)
  let random = rng.next() * totalWeight
  
  for (const w of weights) {
    random -= w.weight
    if (random <= 0) return w.count
  }
  
  return 2
}

/**
 * Generate a single word based on phonology and phonotactics
 */
function generateWord(
  rng: SeededRNG,
  phonology: Phonology,
  phonotactics: Phonotactics,
  style?: GenerationStyle,
  rules?: PhonologicalRule[]
): string {
  const { consonants, vowels } = phonology
  const templates = normalizeTemplates(phonotactics.syllableTemplates)
  const { forbiddenSequences } = phonotactics

  if (templates.length === 0) {
    throw new Error('No syllable templates defined')
  }

  let word = ''
  let attempts = 0
  const maxAttempts = 100

  // Get syllable count based on style
  const syllableCount = getSyllableCount(rng, style)

  for (let i = 0; i < syllableCount; i++) {
    const templateObj = rng.pickWeighted(templates)
    let syllable = ''

    for (const char of templateObj.template) {
      if (char === 'C') {
        if (consonants.length === 0) continue
        if (style) {
          syllable += rng.pickWithPreference(
            consonants,
            style.preferredConsonants || [],
            style.avoidedConsonants || []
          )
        } else {
          syllable += rng.pick(consonants)
        }
      } else if (char === 'V') {
        if (vowels.length === 0) continue
        if (style) {
          syllable += rng.pickWithPreference(
            vowels,
            style.preferredVowels || [],
            style.avoidedVowels || []
          )
        } else {
          syllable += rng.pick(vowels)
        }
      } else {
        syllable += char
      }
    }

    word += syllable
  }

  // Apply common beginnings
  if (style?.commonBeginnings && style.commonBeginnings.length > 0 && rng.next() < 0.3) {
    const beginning = rng.pick(style.commonBeginnings)
    word = beginning + word.slice(1)
  }

  // Apply common endings
  if (style?.commonEndings && style.commonEndings.length > 0 && rng.next() < 0.3) {
    const ending = rng.pick(style.commonEndings)
    word = word.slice(0, -1) + ending
  }

  // Apply phonological rules
  if (rules && rules.length > 0) {
    word = applyPhonologicalRules(word, rules)
  }

  // Check for forbidden sequences
  if (hasForbiddenSequence(word, forbiddenSequences)) {
    attempts++
    if (attempts < maxAttempts) {
      return generateWord(rng, phonology, phonotactics, style, rules)
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
    syllableTemplates: [{ template: 'CV', weight: 2 }, { template: 'CVC', weight: 1 }],
    forbiddenSequences: [],
  }

  for (let i = 0; i < count; i++) {
    const phonemic = generateWord(
      rng, 
      phonology, 
      phonotactics, 
      definition.generationStyle,
      definition.phonologicalRules
    )
    const orthographic = applyOrthography(phonemic, definition.orthography)
    words.push({ phonemic, orthographic })
  }

  return words
}

/**
 * Generate a name based on type and language definition
 */
export function generateName(
  seed: number,
  type: 'person' | 'place' | 'faction',
  definition: LanguageDefinition
): { phonemic: string; orthographic: string } {
  const rng = new SeededRNG(seed)
  
  // Find config for this name type
  const config = definition.nameGenerators?.find(ng => ng.type === type)
  
  // Generate base name
  const phonology = definition.phonology || {
    consonants: ['p', 't', 'k', 'b', 'd', 'g', 'm', 'n', 's', 'l', 'r'],
    vowels: ['a', 'e', 'i', 'o', 'u'],
  }

  const phonotactics = definition.phonotactics || {
    syllableTemplates: [{ template: 'CV', weight: 2 }, { template: 'CVC', weight: 1 }],
    forbiddenSequences: [],
  }

  let baseName = generateWord(
    rng, 
    phonology, 
    phonotactics, 
    definition.generationStyle,
    definition.phonologicalRules
  )
  
  // Capitalize first letter
  baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1)
  
  // For place names, possibly add a second word
  if (type === 'place' && rng.next() < 0.4) {
    const secondWord = generateWord(
      rng, 
      phonology, 
      phonotactics, 
      definition.generationStyle,
      definition.phonologicalRules
    )
    baseName = baseName + ' ' + secondWord.charAt(0).toUpperCase() + secondWord.slice(1)
  }
  
  // For faction names, possibly add descriptor
  if (type === 'faction' && config?.descriptorSuffix && rng.next() < 0.5) {
    const descriptor = rng.pick(config.descriptorSuffix)
    baseName = 'The ' + baseName + ' ' + descriptor
  } else if (type === 'faction') {
    baseName = 'The ' + baseName
  }
  
  // For person names, possibly add title
  if (type === 'person' && config?.titlePrefix && rng.next() < 0.3) {
    const title = rng.pick(config.titlePrefix)
    baseName = title + ' ' + baseName
  }
  
  const orthographic = applyOrthography(baseName, definition.orthography)
  
  return { phonemic: baseName, orthographic }
}

/**
 * Generate multiple names of a specific type
 */
export function generateNames(
  seed: number,
  count: number,
  type: 'person' | 'place' | 'faction',
  definition: LanguageDefinition
): Array<{ phonemic: string; orthographic: string }> {
  const names: Array<{ phonemic: string; orthographic: string }> = []
  
  for (let i = 0; i < count; i++) {
    names.push(generateName(seed + i * 1000, type, definition))
  }
  
  return names
}
