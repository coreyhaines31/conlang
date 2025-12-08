/**
 * Text Generator - Structured gloss-to-conlang translation
 * 
 * This module provides a "safe path" translation approach where users
 * specify glosses with grammatical annotations, and the system generates
 * conlang text following their language's rules.
 */

import { LanguageDefinition, generateWords, SeededRNG, applyOrthography } from './generator'
import { 
  MorphologyConfig, 
  Affix, 
  SyntaxConfig, 
  applyAffix, 
  DEFAULT_SYNTAX,
} from './morphology'
import { LexiconEntry } from './supabase/types'

// Grammatical features that can be annotated on glosses
export interface GrammaticalFeatures {
  number?: 'singular' | 'plural' | 'dual'
  tense?: 'past' | 'present' | 'future'
  aspect?: 'perfective' | 'imperfective' | 'progressive'
  mood?: 'indicative' | 'subjunctive' | 'imperative' | 'conditional'
  person?: '1st' | '2nd' | '3rd'
  case?: 'nominative' | 'accusative' | 'dative' | 'genitive' | 'locative' | 'instrumental'
  gender?: 'masculine' | 'feminine' | 'neuter'
  definiteness?: 'definite' | 'indefinite'
  voice?: 'active' | 'passive'
  degree?: 'positive' | 'comparative' | 'superlative'
  negation?: boolean
  diminutive?: boolean
  augmentative?: boolean
}

// A word in the structured input
export interface GlossWord {
  id: string
  gloss: string                    // The meaning/concept (e.g., "cat", "run", "big")
  role: 'S' | 'V' | 'O' | 'ADJ' | 'ADV' | 'DET' | 'PREP' | 'CONJ' | 'PART' | 'OTHER'
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'determiner' | 'preposition' | 'conjunction' | 'particle' | 'other'
  features: GrammaticalFeatures
  modifies?: string                // ID of the word this modifies (for adjectives/adverbs)
}

// A clause/sentence in the structured input
export interface GlossClause {
  id: string
  words: GlossWord[]
  clauseType: 'declarative' | 'interrogative' | 'imperative' | 'exclamatory'
  isSubordinate?: boolean
  subordinateType?: 'relative' | 'conditional' | 'temporal' | 'causal' | 'purpose'
}

// Full structured input for generation
export interface StructuredInput {
  clauses: GlossClause[]
  context?: string                 // Optional context/notes for the generator
}

// Result of generation for a single word
export interface GeneratedWord {
  original: GlossWord
  baseForm: string                 // From lexicon or generated
  inflectedForm: string            // After affixes applied
  orthographicForm: string         // After orthography mapping
  affixesApplied: string[]         // List of affixes that were applied
  isFromLexicon: boolean           // Whether base came from lexicon
  warnings: string[]               // Any warnings (missing affixes, etc.)
}

// Result of generation for a clause
export interface GeneratedClause {
  original: GlossClause
  words: GeneratedWord[]
  reorderedWords: GeneratedWord[]  // After syntax rules applied
  phonemicOutput: string           // Final phonemic string
  orthographicOutput: string       // Final orthographic string
  gloss: string                    // Interlinear gloss
}

// Full generation result
export interface GenerationResult {
  clauses: GeneratedClause[]
  fullPhonemic: string
  fullOrthographic: string
  fullGloss: string
  warnings: string[]
  stats: {
    totalWords: number
    fromLexicon: number
    generated: number
    affixesApplied: number
  }
}

/**
 * Find matching affixes for grammatical features
 */
function findAffixesForFeatures(
  affixes: Affix[],
  features: GrammaticalFeatures,
  partOfSpeech: string
): Affix[] {
  const matches: Affix[] = []
  
  for (const affix of affixes) {
    // Check if affix applies to this part of speech
    if (affix.appliesTo && affix.appliesTo.length > 0) {
      if (!affix.appliesTo.includes(partOfSpeech)) continue
    }
    
    // Match features
    if (features.number && affix.category === 'number' && affix.value === features.number) {
      matches.push(affix)
    }
    if (features.tense && affix.category === 'tense' && affix.value === features.tense) {
      matches.push(affix)
    }
    if (features.person && affix.category === 'person' && affix.value.includes(features.person)) {
      matches.push(affix)
    }
    if (features.case && affix.category === 'case' && affix.value === features.case) {
      matches.push(affix)
    }
    if (features.mood && affix.category === 'mood' && affix.value === features.mood) {
      matches.push(affix)
    }
    if (features.aspect && affix.category === 'aspect' && affix.value === features.aspect) {
      matches.push(affix)
    }
    if (features.voice && affix.category === 'voice' && affix.value === features.voice) {
      matches.push(affix)
    }
    if (features.degree && affix.category === 'degree' && affix.value === features.degree) {
      matches.push(affix)
    }
    if (features.negation && affix.category === 'negation') {
      matches.push(affix)
    }
    if (features.diminutive && affix.category === 'diminutive') {
      matches.push(affix)
    }
    if (features.augmentative && affix.category === 'augmentative') {
      matches.push(affix)
    }
  }
  
  // Sort by priority
  return matches.sort((a, b) => (a.priority || 0) - (b.priority || 0))
}

/**
 * Reorder words based on syntax configuration
 */
function reorderClause(
  words: GeneratedWord[],
  syntax: SyntaxConfig,
  clauseType: string
): GeneratedWord[] {
  // Group words by role
  const subject: GeneratedWord[] = []
  const verb: GeneratedWord[] = []
  const object: GeneratedWord[] = []
  const determiners: GeneratedWord[] = []
  const adjectives: GeneratedWord[] = []
  const adverbs: GeneratedWord[] = []
  const prepositions: GeneratedWord[] = []
  const other: GeneratedWord[] = []
  
  // Track modifiers for each noun
  const subjectMods: GeneratedWord[] = []
  const objectMods: GeneratedWord[] = []
  
  let currentNounGroup: 'subject' | 'object' | null = null
  
  for (const word of words) {
    const role = word.original.role
    
    if (role === 'S') {
      currentNounGroup = 'subject'
      subject.push(word)
    } else if (role === 'O') {
      currentNounGroup = 'object'
      object.push(word)
    } else if (role === 'V') {
      verb.push(word)
      currentNounGroup = null
    } else if (role === 'DET') {
      if (currentNounGroup === 'subject' || (currentNounGroup === null && subject.length === 0)) {
        subjectMods.push(word)
      } else {
        objectMods.push(word)
      }
    } else if (role === 'ADJ') {
      if (currentNounGroup === 'subject' || (currentNounGroup === null && subject.length === 0)) {
        subjectMods.push(word)
      } else {
        objectMods.push(word)
      }
    } else if (role === 'ADV') {
      adverbs.push(word)
    } else if (role === 'PREP') {
      prepositions.push(word)
    } else {
      other.push(word)
    }
  }
  
  // Build noun phrases
  const buildNounPhrase = (mods: GeneratedWord[], noun: GeneratedWord | undefined): GeneratedWord[] => {
    if (!noun) return mods
    
    const dets = mods.filter(w => w.original.role === 'DET')
    const adjs = mods.filter(w => w.original.role === 'ADJ')
    
    const result: GeneratedWord[] = []
    
    // Determiners first
    result.push(...dets)
    
    // Adjectives based on position
    if (syntax.adjectivePosition === 'before') {
      result.push(...adjs)
      result.push(noun)
    } else {
      result.push(noun)
      result.push(...adjs)
    }
    
    return result
  }
  
  const subjectPhrase = buildNounPhrase(subjectMods, subject[0])
  const objectPhrase = buildNounPhrase(objectMods, object[0])
  
  // Apply word order
  const result: GeneratedWord[] = []
  
  // Add adverbs at the start if they exist
  const sentenceAdverbs = adverbs.filter(a => !a.original.modifies)
  
  switch (syntax.wordOrder) {
    case 'SVO':
      result.push(...sentenceAdverbs, ...subjectPhrase, ...verb, ...objectPhrase)
      break
    case 'SOV':
      result.push(...sentenceAdverbs, ...subjectPhrase, ...objectPhrase, ...verb)
      break
    case 'VSO':
      result.push(...sentenceAdverbs, ...verb, ...subjectPhrase, ...objectPhrase)
      break
    case 'VOS':
      result.push(...sentenceAdverbs, ...verb, ...objectPhrase, ...subjectPhrase)
      break
    case 'OSV':
      result.push(...sentenceAdverbs, ...objectPhrase, ...subjectPhrase, ...verb)
      break
    case 'OVS':
      result.push(...sentenceAdverbs, ...objectPhrase, ...verb, ...subjectPhrase)
      break
    case 'free':
    default:
      // Keep original order
      return words
  }
  
  // Add remaining words
  result.push(...prepositions, ...other)
  
  return result.filter(w => w !== undefined)
}

/**
 * Generate conlang text from structured input
 */
export function generateFromStructured(
  input: StructuredInput,
  definition: LanguageDefinition,
  lexicon: LexiconEntry[],
  seed: number
): GenerationResult {
  const rng = new SeededRNG(seed)
  const morphology = definition.morphology
  const affixes = morphology?.affixes || []
  const syntax = morphology?.syntax || DEFAULT_SYNTAX
  const orthography = definition.orthography || {}
  
  // Build lexicon lookup
  const lexiconMap = new Map(
    lexicon.map(entry => [entry.gloss.toLowerCase(), entry])
  )
  
  const allWarnings: string[] = []
  let totalFromLexicon = 0
  let totalGenerated = 0
  let totalAffixes = 0
  
  const generatedClauses: GeneratedClause[] = input.clauses.map(clause => {
    const generatedWords: GeneratedWord[] = clause.words.map(word => {
      const warnings: string[] = []
      
      // Look up in lexicon
      const lexEntry = lexiconMap.get(word.gloss.toLowerCase())
      let baseForm: string
      let isFromLexicon: boolean
      
      if (lexEntry && lexEntry.phonemic_form) {
        baseForm = lexEntry.phonemic_form
        isFromLexicon = true
        totalFromLexicon++
      } else {
        // Generate a placeholder word
        const words = generateWords(
          seed + word.gloss.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0),
          1,
          definition
        )
        baseForm = words[0]?.phonemic || word.gloss
        isFromLexicon = false
        totalGenerated++
        warnings.push(`"${word.gloss}" not in lexicon, generated placeholder`)
      }
      
      // Find and apply affixes
      const matchingAffixes = findAffixesForFeatures(affixes, word.features, word.partOfSpeech)
      let inflectedForm = baseForm
      const appliedAffixNames: string[] = []
      
      for (const affix of matchingAffixes) {
        inflectedForm = applyAffix(inflectedForm, affix)
        appliedAffixNames.push(`${affix.type}:${affix.form}(${affix.category}:${affix.value})`)
        totalAffixes++
      }
      
      // Check for missing expected affixes
      if (word.features.number === 'plural' && !matchingAffixes.some(a => a.category === 'number')) {
        warnings.push(`No plural affix available`)
      }
      if (word.features.tense && !matchingAffixes.some(a => a.category === 'tense')) {
        warnings.push(`No ${word.features.tense} tense affix available`)
      }
      
      // Apply orthography
      const orthographicForm = applyOrthography(inflectedForm, orthography)
      
      return {
        original: word,
        baseForm,
        inflectedForm,
        orthographicForm,
        affixesApplied: appliedAffixNames,
        isFromLexicon,
        warnings,
      }
    })
    
    // Collect warnings
    generatedWords.forEach(w => allWarnings.push(...w.warnings))
    
    // Apply word order
    const reorderedWords = reorderClause(generatedWords, syntax, clause.clauseType)
    
    // Build output strings
    const phonemicOutput = reorderedWords.map(w => w.inflectedForm).join(' ')
    const orthographicOutput = reorderedWords.map(w => w.orthographicForm).join(' ')
    const gloss = clause.words.map(w => {
      const features: string[] = []
      if (w.features.number) features.push(w.features.number.toUpperCase())
      if (w.features.tense) features.push(w.features.tense.toUpperCase())
      if (w.features.person) features.push(w.features.person.toUpperCase())
      if (w.features.case) features.push(w.features.case.toUpperCase())
      
      return features.length > 0 
        ? `${w.gloss}[${features.join('.')}]`
        : w.gloss
    }).join(' ')
    
    return {
      original: clause,
      words: generatedWords,
      reorderedWords,
      phonemicOutput,
      orthographicOutput,
      gloss,
    }
  })
  
  // Build full outputs
  const fullPhonemic = generatedClauses.map(c => c.phonemicOutput).join('. ')
  const fullOrthographic = generatedClauses.map(c => c.orthographicOutput).join('. ')
  const fullGloss = generatedClauses.map(c => c.gloss).join('. ')
  
  return {
    clauses: generatedClauses,
    fullPhonemic,
    fullOrthographic,
    fullGloss,
    warnings: [...new Set(allWarnings)], // Dedupe warnings
    stats: {
      totalWords: input.clauses.reduce((sum, c) => sum + c.words.length, 0),
      fromLexicon: totalFromLexicon,
      generated: totalGenerated,
      affixesApplied: totalAffixes,
    },
  }
}

/**
 * Create an empty gloss word with defaults
 */
export function createEmptyGlossWord(id?: string): GlossWord {
  return {
    id: id || `word-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    gloss: '',
    role: 'OTHER',
    partOfSpeech: 'noun',
    features: {},
  }
}

/**
 * Create an empty clause with defaults
 */
export function createEmptyClause(id?: string): GlossClause {
  return {
    id: id || `clause-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    words: [],
    clauseType: 'declarative',
  }
}

/**
 * Parse simple English-like gloss notation into structured input
 * 
 * Format: "ROLE:gloss[FEATURES]"
 * Example: "S:cat[SG] V:see[PAST.3RD] O:dog[PL]"
 */
export function parseGlossNotation(notation: string): GlossClause {
  const clause = createEmptyClause()
  
  // Split by whitespace
  const tokens = notation.trim().split(/\s+/)
  
  for (const token of tokens) {
    const word = createEmptyGlossWord()
    
    // Parse role:gloss[features] format
    const match = token.match(/^(?:([A-Z]+):)?([a-zA-Z0-9_-]+)(?:\[([^\]]+)\])?$/)
    
    if (match) {
      const [, role, gloss, features] = match
      
      word.gloss = gloss
      
      // Parse role
      if (role) {
        const roleMap: Record<string, GlossWord['role']> = {
          'S': 'S', 'SUBJ': 'S', 'SUBJECT': 'S',
          'V': 'V', 'VERB': 'V',
          'O': 'O', 'OBJ': 'O', 'OBJECT': 'O',
          'ADJ': 'ADJ', 'ADJECTIVE': 'ADJ',
          'ADV': 'ADV', 'ADVERB': 'ADV',
          'DET': 'DET', 'DETERMINER': 'DET',
          'PREP': 'PREP', 'PREPOSITION': 'PREP',
          'CONJ': 'CONJ', 'CONJUNCTION': 'CONJ',
          'PART': 'PART', 'PARTICLE': 'PART',
        }
        word.role = roleMap[role.toUpperCase()] || 'OTHER'
      }
      
      // Infer part of speech from role
      const posFromRole: Record<string, GlossWord['partOfSpeech']> = {
        'S': 'noun', 'O': 'noun',
        'V': 'verb',
        'ADJ': 'adjective',
        'ADV': 'adverb',
        'DET': 'determiner',
        'PREP': 'preposition',
        'CONJ': 'conjunction',
        'PART': 'particle',
      }
      word.partOfSpeech = posFromRole[word.role] || 'other'
      
      // Parse features
      if (features) {
        const featureList = features.split('.')
        for (const f of featureList) {
          const feat = f.toUpperCase()
          
          // Number
          if (['SG', 'SINGULAR'].includes(feat)) word.features.number = 'singular'
          if (['PL', 'PLURAL'].includes(feat)) word.features.number = 'plural'
          if (['DU', 'DUAL'].includes(feat)) word.features.number = 'dual'
          
          // Tense
          if (['PAST', 'PST'].includes(feat)) word.features.tense = 'past'
          if (['PRES', 'PRESENT'].includes(feat)) word.features.tense = 'present'
          if (['FUT', 'FUTURE'].includes(feat)) word.features.tense = 'future'
          
          // Person
          if (['1ST', '1SG', '1PL', 'FIRST'].includes(feat)) word.features.person = '1st'
          if (['2ND', '2SG', '2PL', 'SECOND'].includes(feat)) word.features.person = '2nd'
          if (['3RD', '3SG', '3PL', 'THIRD'].includes(feat)) word.features.person = '3rd'
          
          // Case
          if (['NOM', 'NOMINATIVE'].includes(feat)) word.features.case = 'nominative'
          if (['ACC', 'ACCUSATIVE'].includes(feat)) word.features.case = 'accusative'
          if (['DAT', 'DATIVE'].includes(feat)) word.features.case = 'dative'
          if (['GEN', 'GENITIVE'].includes(feat)) word.features.case = 'genitive'
          
          // Mood
          if (['IND', 'INDICATIVE'].includes(feat)) word.features.mood = 'indicative'
          if (['SUBJ', 'SUBJUNCTIVE'].includes(feat)) word.features.mood = 'subjunctive'
          if (['IMP', 'IMPERATIVE'].includes(feat)) word.features.mood = 'imperative'
          
          // Other
          if (['DEF', 'DEFINITE'].includes(feat)) word.features.definiteness = 'definite'
          if (['INDEF', 'INDEFINITE'].includes(feat)) word.features.definiteness = 'indefinite'
          if (['NEG', 'NEGATIVE'].includes(feat)) word.features.negation = true
          if (['DIM', 'DIMINUTIVE'].includes(feat)) word.features.diminutive = true
          if (['AUG', 'AUGMENTATIVE'].includes(feat)) word.features.augmentative = true
        }
      }
      
      clause.words.push(word)
    }
  }
  
  return clause
}

/**
 * Convert a clause to gloss notation string
 */
export function toGlossNotation(clause: GlossClause): string {
  return clause.words.map(word => {
    const parts: string[] = []
    
    // Role prefix
    if (word.role !== 'OTHER') {
      parts.push(`${word.role}:`)
    }
    
    // Gloss
    parts.push(word.gloss)
    
    // Features
    const features: string[] = []
    if (word.features.number) features.push(word.features.number.toUpperCase().slice(0, 2))
    if (word.features.tense) features.push(word.features.tense.toUpperCase().slice(0, 4))
    if (word.features.person) features.push(word.features.person.toUpperCase())
    if (word.features.case) features.push(word.features.case.toUpperCase().slice(0, 3))
    if (word.features.negation) features.push('NEG')
    if (word.features.diminutive) features.push('DIM')
    if (word.features.augmentative) features.push('AUG')
    
    if (features.length > 0) {
      parts.push(`[${features.join('.')}]`)
    }
    
    return parts.join('')
  }).join(' ')
}

