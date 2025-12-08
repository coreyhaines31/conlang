/**
 * Morphology system for word-building rules
 */

export type AffixType = 'prefix' | 'suffix' | 'infix' | 'circumfix'

export type GrammaticalCategory = 
  | 'number'      // singular, plural, dual
  | 'tense'       // past, present, future
  | 'aspect'      // perfective, imperfective, progressive
  | 'mood'        // indicative, subjunctive, imperative
  | 'person'      // 1st, 2nd, 3rd
  | 'case'        // nominative, accusative, dative, genitive
  | 'gender'      // masculine, feminine, neuter
  | 'possession'  // my, your, his, her, its, our, their
  | 'definiteness'// definite, indefinite
  | 'degree'      // comparative, superlative
  | 'voice'       // active, passive
  | 'negation'    // negative marker
  | 'diminutive'  // small/cute form
  | 'augmentative'// large/intense form

export interface Affix {
  id: string
  type: AffixType
  form: string              // The actual affix (e.g., "-s", "un-")
  category: GrammaticalCategory
  value: string             // The meaning (e.g., "plural", "past", "1st person")
  description?: string      // Human-readable description
  appliesTo?: string[]      // Parts of speech this applies to (e.g., ["noun", "verb"])
  phonologicalRules?: string[] // IDs of phonological rules to apply
  priority?: number         // Order of application (lower = first)
}

export interface CompoundRule {
  id: string
  name: string
  pattern: string[]         // e.g., ["noun", "noun"] or ["adj", "noun"]
  connector?: string        // Optional connecting element
  headPosition: 'first' | 'last'  // Which element is the head
  description?: string
}

export type WordOrder = 'SVO' | 'SOV' | 'VSO' | 'VOS' | 'OSV' | 'OVS' | 'free'
export type AdjectivePosition = 'before' | 'after'
export type AdpositionType = 'preposition' | 'postposition' | 'circumposition'
export type GenderSystem = 'none' | 'masculine-feminine' | 'masculine-feminine-neuter' | 'animate-inanimate' | 'human-nonhuman'

export interface SyntaxConfig {
  wordOrder: WordOrder
  adjectivePosition: AdjectivePosition
  adpositionType: AdpositionType
  genderSystem: GenderSystem
  hasArticles: boolean
  definitenessMarking: 'article' | 'affix' | 'none'
  pluralMarking: 'suffix' | 'prefix' | 'reduplication' | 'none'
  possessionMarking: 'affix' | 'particle' | 'word-order' | 'none'
  tenseMarking: 'suffix' | 'prefix' | 'particle' | 'none'
  questionFormation: 'particle' | 'inversion' | 'intonation'
  negationPosition: 'before-verb' | 'after-verb' | 'double'
}

export interface MorphologyConfig {
  affixes: Affix[]
  compoundRules: CompoundRule[]
  syntax: SyntaxConfig
}

// Default syntax configuration
export const DEFAULT_SYNTAX: SyntaxConfig = {
  wordOrder: 'SVO',
  adjectivePosition: 'before',
  adpositionType: 'preposition',
  genderSystem: 'none',
  hasArticles: true,
  definitenessMarking: 'article',
  pluralMarking: 'suffix',
  possessionMarking: 'affix',
  tenseMarking: 'suffix',
  questionFormation: 'intonation',
  negationPosition: 'before-verb',
}

// Common affix presets
export const AFFIX_PRESETS: Record<string, Affix[]> = {
  'basic-number': [
    { id: 'plural', type: 'suffix', form: '-s', category: 'number', value: 'plural', appliesTo: ['noun'], priority: 10 },
    { id: 'dual', type: 'suffix', form: '-du', category: 'number', value: 'dual', appliesTo: ['noun'], priority: 10 },
  ],
  'basic-tense': [
    { id: 'past', type: 'suffix', form: '-ed', category: 'tense', value: 'past', appliesTo: ['verb'], priority: 20 },
    { id: 'future', type: 'prefix', form: 'wi-', category: 'tense', value: 'future', appliesTo: ['verb'], priority: 20 },
  ],
  'basic-person': [
    { id: '1sg', type: 'suffix', form: '-mi', category: 'person', value: '1st-singular', appliesTo: ['verb'], priority: 30 },
    { id: '2sg', type: 'suffix', form: '-ti', category: 'person', value: '2nd-singular', appliesTo: ['verb'], priority: 30 },
    { id: '3sg', type: 'suffix', form: '-si', category: 'person', value: '3rd-singular', appliesTo: ['verb'], priority: 30 },
  ],
  'basic-possession': [
    { id: 'poss-1sg', type: 'suffix', form: '-mo', category: 'possession', value: 'my', appliesTo: ['noun'], priority: 5 },
    { id: 'poss-2sg', type: 'suffix', form: '-to', category: 'possession', value: 'your', appliesTo: ['noun'], priority: 5 },
    { id: 'poss-3sg', type: 'suffix', form: '-so', category: 'possession', value: 'his/her', appliesTo: ['noun'], priority: 5 },
  ],
  'basic-case': [
    { id: 'nom', type: 'suffix', form: '-a', category: 'case', value: 'nominative', appliesTo: ['noun'], priority: 40 },
    { id: 'acc', type: 'suffix', form: '-o', category: 'case', value: 'accusative', appliesTo: ['noun'], priority: 40 },
    { id: 'gen', type: 'suffix', form: '-i', category: 'case', value: 'genitive', appliesTo: ['noun'], priority: 40 },
    { id: 'dat', type: 'suffix', form: '-e', category: 'case', value: 'dative', appliesTo: ['noun'], priority: 40 },
  ],
  'derivational': [
    { id: 'dim', type: 'suffix', form: '-ling', category: 'diminutive', value: 'small', appliesTo: ['noun'], priority: 1 },
    { id: 'aug', type: 'suffix', form: '-on', category: 'augmentative', value: 'large', appliesTo: ['noun'], priority: 1 },
    { id: 'neg', type: 'prefix', form: 'un-', category: 'negation', value: 'not', appliesTo: ['adjective', 'verb'], priority: 1 },
  ],
}

// Compound rule presets
export const COMPOUND_PRESETS: CompoundRule[] = [
  { id: 'noun-noun', name: 'Noun + Noun', pattern: ['noun', 'noun'], headPosition: 'last', description: 'Two nouns combine (e.g., sunflower)' },
  { id: 'adj-noun', name: 'Adjective + Noun', pattern: ['adjective', 'noun'], headPosition: 'last', description: 'Adjective modifies noun (e.g., blackbird)' },
  { id: 'verb-noun', name: 'Verb + Noun', pattern: ['verb', 'noun'], headPosition: 'last', description: 'Action + object (e.g., pickpocket)' },
]

/**
 * Apply an affix to a word
 */
export function applyAffix(word: string, affix: Affix): string {
  const form = affix.form.replace(/^-/, '').replace(/-$/, '')
  
  switch (affix.type) {
    case 'prefix':
      return form + word
    case 'suffix':
      return word + form
    case 'infix':
      // Insert in the middle (after first vowel by default)
      const vowelMatch = word.match(/[aeiou]/i)
      if (vowelMatch && vowelMatch.index !== undefined) {
        return word.slice(0, vowelMatch.index + 1) + form + word.slice(vowelMatch.index + 1)
      }
      return word + form // Fallback to suffix
    case 'circumfix':
      // Split form on + (e.g., "ge-+-t" for German past participle)
      const parts = form.split('+')
      if (parts.length === 2) {
        return parts[0] + word + parts[1]
      }
      return form + word
    default:
      return word
  }
}

/**
 * Apply multiple affixes to a word, respecting priority
 */
export function applyAffixes(word: string, affixes: Affix[]): string {
  const sorted = [...affixes].sort((a, b) => (a.priority || 0) - (b.priority || 0))
  return sorted.reduce((w, affix) => applyAffix(w, affix), word)
}

/**
 * Create a compound word from components
 */
export function createCompound(
  words: string[],
  rule: CompoundRule
): string {
  if (rule.connector) {
    return words.join(rule.connector)
  }
  return words.join('')
}

/**
 * Reorder sentence components based on word order
 */
export function applySyntax(
  subject: string,
  verb: string,
  object: string,
  wordOrder: WordOrder
): string {
  switch (wordOrder) {
    case 'SVO':
      return `${subject} ${verb} ${object}`.trim()
    case 'SOV':
      return `${subject} ${object} ${verb}`.trim()
    case 'VSO':
      return `${verb} ${subject} ${object}`.trim()
    case 'VOS':
      return `${verb} ${object} ${subject}`.trim()
    case 'OSV':
      return `${object} ${subject} ${verb}`.trim()
    case 'OVS':
      return `${object} ${verb} ${subject}`.trim()
    case 'free':
    default:
      return `${subject} ${verb} ${object}`.trim()
  }
}

/**
 * Position adjective relative to noun
 */
export function positionAdjective(
  adjective: string,
  noun: string,
  position: AdjectivePosition
): string {
  return position === 'before' 
    ? `${adjective} ${noun}` 
    : `${noun} ${adjective}`
}

/**
 * Create an empty morphology config
 */
export function createEmptyMorphologyConfig(): MorphologyConfig {
  return {
    affixes: [],
    compoundRules: [],
    syntax: { ...DEFAULT_SYNTAX },
  }
}

