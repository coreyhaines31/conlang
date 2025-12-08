/**
 * Phrase Transformer - Applies morphology and syntax rules to phrase rendering
 */

import { LanguageDefinition } from './generator'
import { 
  MorphologyConfig, 
  Affix, 
  SyntaxConfig, 
  applyAffix, 
  DEFAULT_SYNTAX,
  positionAdjective,
} from './morphology'
import { LexiconEntry } from './supabase/types'
import { GrammaticalPhrase } from './phrases'

export interface TransformedWord {
  original: string           // Original gloss
  baseForm: string          // Base form from lexicon (or generated)
  transformed: string       // After affixes applied
  orthographic: string      // After orthography mapping
  role: string              // Grammatical role
  affixesApplied: string[]  // Which affixes were applied
  isFromLexicon: boolean    // Whether base form came from lexicon
}

export interface TransformedPhrase {
  original: GrammaticalPhrase
  words: TransformedWord[]
  reordered: string[]       // Final word order after syntax rules
  finalPhonemic: string     // Complete phonemic output
  finalOrthographic: string // Complete orthographic output
}

/**
 * Find affixes matching the grammatical features of a word
 */
function findMatchingAffixes(
  affixes: Affix[],
  features: {
    tense?: string
    number?: string
    person?: string
    case?: string
  },
  partOfSpeech?: string
): Affix[] {
  return affixes.filter(affix => {
    // Check part of speech if specified
    if (affix.appliesTo && affix.appliesTo.length > 0 && partOfSpeech) {
      if (!affix.appliesTo.includes(partOfSpeech)) return false
    }
    
    // Match features
    if (features.number && affix.category === 'number' && affix.value === features.number) {
      return true
    }
    if (features.tense && affix.category === 'tense' && affix.value === features.tense) {
      return true
    }
    if (features.person && affix.category === 'person' && affix.value.includes(features.person)) {
      return true
    }
    if (features.case && affix.category === 'case' && affix.value === features.case) {
      return true
    }
    
    return false
  })
}

/**
 * Get the part of speech from a grammatical role
 */
function roleToPartOfSpeech(role: string): string | undefined {
  switch (role) {
    case 'S':
    case 'O':
      return 'noun'
    case 'V':
      return 'verb'
    case 'ADJ':
      return 'adjective'
    case 'ADV':
      return 'adverb'
    default:
      return undefined
  }
}

/**
 * Apply orthography mapping to a word
 */
function applyOrthography(
  phonemic: string,
  orthography: Record<string, string> = {}
): string {
  let result = phonemic
  
  // Sort by length (longest first) to handle digraphs
  const sortedMappings = Object.entries(orthography)
    .sort(([a], [b]) => b.length - a.length)
  
  for (const [phoneme, grapheme] of sortedMappings) {
    result = result.split(phoneme).join(grapheme)
  }
  
  return result
}

/**
 * Reorder sentence components based on word order
 */
function reorderBySyntax(
  words: TransformedWord[],
  syntax: SyntaxConfig
): TransformedWord[] {
  // Group words by role
  const subject: TransformedWord[] = []
  const verb: TransformedWord[] = []
  const object: TransformedWord[] = []
  const adjectives: TransformedWord[] = []
  const determiners: TransformedWord[] = []
  const other: TransformedWord[] = []
  
  // Track which determiner/adjective belongs to which noun
  let currentGroup: 'subject' | 'object' | null = null
  const subjectModifiers: TransformedWord[] = []
  const objectModifiers: TransformedWord[] = []
  
  for (const word of words) {
    if (word.role === 'S') {
      currentGroup = 'subject'
      subject.push(word)
    } else if (word.role === 'O') {
      currentGroup = 'object'
      object.push(word)
    } else if (word.role === 'V') {
      verb.push(word)
      currentGroup = null
    } else if (word.role === 'DET' || word.role === 'ADJ') {
      if (currentGroup === null) {
        // Assume next noun is subject
        subjectModifiers.push(word)
      } else if (currentGroup === 'subject') {
        subjectModifiers.push(word)
      } else {
        objectModifiers.push(word)
      }
    } else {
      other.push(word)
    }
  }
  
  // Build subject phrase with modifiers
  const buildNounPhrase = (modifiers: TransformedWord[], noun: TransformedWord | undefined, syntax: SyntaxConfig): TransformedWord[] => {
    if (!noun) return modifiers
    
    const dets = modifiers.filter(w => w.role === 'DET')
    const adjs = modifiers.filter(w => w.role === 'ADJ')
    
    const result: TransformedWord[] = []
    
    // Add determiners first
    result.push(...dets)
    
    // Position adjectives based on syntax
    if (syntax.adjectivePosition === 'before') {
      result.push(...adjs)
      result.push(noun)
    } else {
      result.push(noun)
      result.push(...adjs)
    }
    
    return result
  }
  
  const subjectPhrase = buildNounPhrase(subjectModifiers, subject[0], syntax)
  const objectPhrase = buildNounPhrase(objectModifiers, object[0], syntax)
  
  // Apply word order
  const result: TransformedWord[] = []
  
  switch (syntax.wordOrder) {
    case 'SVO':
      result.push(...subjectPhrase, ...verb, ...objectPhrase)
      break
    case 'SOV':
      result.push(...subjectPhrase, ...objectPhrase, ...verb)
      break
    case 'VSO':
      result.push(...verb, ...subjectPhrase, ...objectPhrase)
      break
    case 'VOS':
      result.push(...verb, ...objectPhrase, ...subjectPhrase)
      break
    case 'OSV':
      result.push(...objectPhrase, ...subjectPhrase, ...verb)
      break
    case 'OVS':
      result.push(...objectPhrase, ...verb, ...subjectPhrase)
      break
    case 'free':
    default:
      // Keep original order
      return words
  }
  
  // Add any other words at the end
  result.push(...other)
  
  return result.filter(w => w !== undefined)
}

/**
 * Transform a grammatical phrase using the language definition
 */
export function transformPhrase(
  phrase: GrammaticalPhrase,
  definition: LanguageDefinition,
  lexicon: LexiconEntry[],
  generateWord: (gloss: string) => { phonemic: string; orthographic: string }
): TransformedPhrase {
  const morphology = definition.morphology
  const affixes = morphology?.affixes || []
  const syntax = morphology?.syntax || DEFAULT_SYNTAX
  const orthography = definition.orthography || {}
  
  // Create a lookup map for the lexicon
  const lexiconMap = new Map(
    lexicon.map(entry => [entry.gloss.toLowerCase(), entry])
  )
  
  // Transform each word in the phrase
  const transformedWords: TransformedWord[] = phrase.structure.map(wordDef => {
    // Look up base form in lexicon
    const lexEntry = lexiconMap.get(wordDef.gloss.toLowerCase())
    let baseForm: string
    let isFromLexicon: boolean
    
    if (lexEntry && lexEntry.phonemic_form) {
      baseForm = lexEntry.phonemic_form
      isFromLexicon = true
    } else {
      // Generate a placeholder word
      const generated = generateWord(wordDef.gloss)
      baseForm = generated.phonemic
      isFromLexicon = false
    }
    
    // Find matching affixes based on grammatical features
    const pos = roleToPartOfSpeech(wordDef.role)
    const matchingAffixes = findMatchingAffixes(
      affixes,
      {
        tense: wordDef.tense,
        number: wordDef.number,
        person: wordDef.person,
        case: wordDef.case,
      },
      pos
    )
    
    // Apply affixes
    let transformed = baseForm
    const appliedAffixNames: string[] = []
    
    for (const affix of matchingAffixes) {
      transformed = applyAffix(transformed, affix)
      appliedAffixNames.push(`${affix.type}:${affix.form}`)
    }
    
    // Apply orthography
    const orthographic = applyOrthography(transformed, orthography)
    
    return {
      original: wordDef.gloss,
      baseForm,
      transformed,
      orthographic,
      role: wordDef.role,
      affixesApplied: appliedAffixNames,
      isFromLexicon,
    }
  })
  
  // Reorder based on syntax
  const reorderedWords = reorderBySyntax(transformedWords, syntax)
  
  // Build final strings
  const finalPhonemic = reorderedWords.map(w => w.transformed).join(' ')
  const finalOrthographic = reorderedWords.map(w => w.orthographic).join(' ')
  
  return {
    original: phrase,
    words: transformedWords,
    reordered: reorderedWords.map(w => w.orthographic),
    finalPhonemic,
    finalOrthographic,
  }
}

/**
 * Simple phrase transformer for non-grammatical phrases (existing behavior)
 */
export function transformSimplePhrase(
  glosses: string[],
  definition: LanguageDefinition,
  lexicon: LexiconEntry[],
  generateWord: (gloss: string) => { phonemic: string; orthographic: string }
): { phonemic: string; orthographic: string; missing: string[] } {
  const orthography = definition.orthography || {}
  const lexiconMap = new Map(
    lexicon.map(entry => [entry.gloss.toLowerCase(), entry])
  )
  
  const results: { phonemic: string; orthographic: string }[] = []
  const missing: string[] = []
  
  for (const gloss of glosses) {
    const entry = lexiconMap.get(gloss.toLowerCase())
    
    if (entry && entry.phonemic_form) {
      results.push({
        phonemic: entry.phonemic_form,
        orthographic: entry.orthographic_form || applyOrthography(entry.phonemic_form, orthography),
      })
    } else {
      const generated = generateWord(gloss)
      results.push(generated)
      missing.push(gloss)
    }
  }
  
  return {
    phonemic: results.map(r => r.phonemic).join(' '),
    orthographic: results.map(r => r.orthographic).join(' '),
    missing,
  }
}

