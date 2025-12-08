import { describe, it, expect, vi } from 'vitest'
import {
  transformPhrase,
  transformSimplePhrase,
  TransformedWord,
} from './phraseTransformer'
import { LanguageDefinition } from './generator'
import { GrammaticalPhrase } from './phrases'
import { LexiconEntry } from './supabase/types'

// Mock generate function that creates predictable output
const mockGenerateWord = (gloss: string) => ({
  phonemic: `gen-${gloss}`,
  orthographic: `gen-${gloss}`,
})

describe('transformPhrase', () => {
  const basicDefinition: LanguageDefinition = {
    phonology: { consonants: ['t'], vowels: ['a'] },
    phonotactics: { syllableTemplates: [{ template: 'CV', weight: 1 }], forbiddenSequences: [] },
    orthography: { mappings: {} },
    morphology: {
      affixes: [
        { id: 'plural', type: 'suffix', form: '-s', category: 'number', value: 'plural', appliesTo: ['noun'], priority: 10 },
        { id: 'past', type: 'suffix', form: '-ed', category: 'tense', value: 'past', appliesTo: ['verb'], priority: 20 },
      ],
      compoundRules: [],
      syntax: {
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
      },
    },
  }

  const testLexicon: LexiconEntry[] = [
    {
      id: '1',
      language_id: 'test',
      gloss: 'cat',
      phonemic_form: 'kata',
      orthographic_form: 'kata',
      part_of_speech: 'noun',
      tags: [],
      notes: null,
      created_at: '',
      updated_at: '',
    },
    {
      id: '2',
      language_id: 'test',
      gloss: 'see',
      phonemic_form: 'mira',
      orthographic_form: 'mira',
      part_of_speech: 'verb',
      tags: [],
      notes: null,
      created_at: '',
      updated_at: '',
    },
  ]

  it('transforms a simple SVO phrase', () => {
    const phrase: GrammaticalPhrase = {
      id: 'test',
      english: 'The cat sees',
      structure: [
        { gloss: 'cat', role: 'S' },
        { gloss: 'see', role: 'V' },
      ],
    }

    const result = transformPhrase(phrase, basicDefinition, testLexicon, mockGenerateWord)

    expect(result.words).toHaveLength(2)
    expect(result.words[0].baseForm).toBe('kata')
    expect(result.words[0].isFromLexicon).toBe(true)
    expect(result.words[1].baseForm).toBe('mira')
  })

  it('applies plural suffix to nouns', () => {
    const phrase: GrammaticalPhrase = {
      id: 'test',
      english: 'The cats',
      structure: [
        { gloss: 'cat', role: 'S', number: 'plural' },
      ],
    }

    const result = transformPhrase(phrase, basicDefinition, testLexicon, mockGenerateWord)

    expect(result.words[0].transformed).toBe('katas')
    expect(result.words[0].affixesApplied).toContain('suffix:-s')
  })

  it('applies past tense suffix to verbs', () => {
    const phrase: GrammaticalPhrase = {
      id: 'test',
      english: 'saw',
      structure: [
        { gloss: 'see', role: 'V', tense: 'past' },
      ],
    }

    const result = transformPhrase(phrase, basicDefinition, testLexicon, mockGenerateWord)

    expect(result.words[0].transformed).toBe('miraed')
    expect(result.words[0].affixesApplied).toContain('suffix:-ed')
  })

  it('generates placeholder for unknown words', () => {
    const phrase: GrammaticalPhrase = {
      id: 'test',
      english: 'The dog',
      structure: [
        { gloss: 'dog', role: 'S' },
      ],
    }

    const result = transformPhrase(phrase, basicDefinition, testLexicon, mockGenerateWord)

    expect(result.words[0].baseForm).toBe('gen-dog')
    expect(result.words[0].isFromLexicon).toBe(false)
  })

  it('handles SOV word order', () => {
    const sovDefinition: LanguageDefinition = {
      ...basicDefinition,
      morphology: {
        ...basicDefinition.morphology!,
        syntax: {
          ...basicDefinition.morphology!.syntax,
          wordOrder: 'SOV',
        },
      },
    }

    const phrase: GrammaticalPhrase = {
      id: 'test',
      english: 'Cat sees dog',
      structure: [
        { gloss: 'cat', role: 'S' },
        { gloss: 'see', role: 'V' },
        { gloss: 'dog', role: 'O' },
      ],
    }

    const result = transformPhrase(phrase, sovDefinition, testLexicon, mockGenerateWord)

    // SOV: Subject Object Verb
    expect(result.reordered[0]).toBe('kata')     // Subject
    expect(result.reordered[1]).toBe('gen-dog')  // Object
    expect(result.reordered[2]).toBe('mira')     // Verb
  })

  it('handles VSO word order', () => {
    const vsoDefinition: LanguageDefinition = {
      ...basicDefinition,
      morphology: {
        ...basicDefinition.morphology!,
        syntax: {
          ...basicDefinition.morphology!.syntax,
          wordOrder: 'VSO',
        },
      },
    }

    const phrase: GrammaticalPhrase = {
      id: 'test',
      english: 'Cat sees dog',
      structure: [
        { gloss: 'cat', role: 'S' },
        { gloss: 'see', role: 'V' },
        { gloss: 'dog', role: 'O' },
      ],
    }

    const result = transformPhrase(phrase, vsoDefinition, testLexicon, mockGenerateWord)

    // VSO: Verb Subject Object
    expect(result.reordered[0]).toBe('mira')     // Verb
    expect(result.reordered[1]).toBe('kata')     // Subject
    expect(result.reordered[2]).toBe('gen-dog')  // Object
  })

  it('handles empty phrase', () => {
    const phrase: GrammaticalPhrase = {
      id: 'test',
      english: '',
      structure: [],
    }

    const result = transformPhrase(phrase, basicDefinition, testLexicon, mockGenerateWord)

    expect(result.words).toHaveLength(0)
    expect(result.finalPhonemic).toBe('')
  })

  it('positions adjectives before noun by default', () => {
    const phrase: GrammaticalPhrase = {
      id: 'test',
      english: 'big cat',
      structure: [
        { gloss: 'big', role: 'ADJ' },
        { gloss: 'cat', role: 'S' },
      ],
    }

    const result = transformPhrase(phrase, basicDefinition, testLexicon, mockGenerateWord)

    // With adjectivePosition: 'before', adjective comes first
    expect(result.reordered[0]).toBe('gen-big')
    expect(result.reordered[1]).toBe('kata')
  })

  it('positions adjectives after noun when configured', () => {
    const afterDefinition: LanguageDefinition = {
      ...basicDefinition,
      morphology: {
        ...basicDefinition.morphology!,
        syntax: {
          ...basicDefinition.morphology!.syntax,
          adjectivePosition: 'after',
        },
      },
    }

    const phrase: GrammaticalPhrase = {
      id: 'test',
      english: 'cat big',
      structure: [
        { gloss: 'big', role: 'ADJ' },
        { gloss: 'cat', role: 'S' },
      ],
    }

    const result = transformPhrase(phrase, afterDefinition, testLexicon, mockGenerateWord)

    // With adjectivePosition: 'after', noun comes first
    expect(result.reordered[0]).toBe('kata')
    expect(result.reordered[1]).toBe('gen-big')
  })
})

describe('transformSimplePhrase', () => {
  // Note: transformSimplePhrase expects orthography as Record<string, string> directly
  // not the full Orthography object with mappings property
  const basicDefinition: LanguageDefinition = {
    phonology: { consonants: ['t'], vowels: ['a'] },
    phonotactics: { syllableTemplates: [{ template: 'CV', weight: 1 }], forbiddenSequences: [] },
    // The implementation passes definition.orthography to applyOrthography
    // which expects { k: 'c' } format, not { mappings: { k: 'c' } }
    orthography: { k: 'c' } as any, // Using the format expected by local applyOrthography
  }

  const testLexicon: LexiconEntry[] = [
    {
      id: '1',
      language_id: 'test',
      gloss: 'hello',
      phonemic_form: 'kota',
      orthographic_form: 'cota',
      part_of_speech: null,
      tags: [],
      notes: null,
      created_at: '',
      updated_at: '',
    },
    {
      id: '2',
      language_id: 'test',
      gloss: 'world',
      phonemic_form: 'pako',
      orthographic_form: null,
      part_of_speech: null,
      tags: [],
      notes: null,
      created_at: '',
      updated_at: '',
    },
  ]

  it('uses lexicon entries when available', () => {
    const result = transformSimplePhrase(
      ['hello'],
      basicDefinition,
      testLexicon,
      mockGenerateWord
    )

    expect(result.phonemic).toBe('kota')
    expect(result.orthographic).toBe('cota')
    expect(result.missing).toHaveLength(0)
  })

  it('generates words when not in lexicon', () => {
    const result = transformSimplePhrase(
      ['unknown'],
      basicDefinition,
      testLexicon,
      mockGenerateWord
    )

    expect(result.phonemic).toBe('gen-unknown')
    expect(result.missing).toContain('unknown')
  })

  it('applies orthography when orthographic_form is missing', () => {
    // 'world' has phonemic_form 'pako' but orthographic_form is null
    // The function should apply orthography k→c to get 'paco'
    const result = transformSimplePhrase(
      ['world'],
      basicDefinition,
      testLexicon,
      mockGenerateWord
    )

    expect(result.phonemic).toBe('pako')
    // Note: due to implementation, null orthographic_form triggers orthography mapping
    expect(result.orthographic).toBe('paco')
  })

  it('joins multiple words with spaces', () => {
    const result = transformSimplePhrase(
      ['hello', 'world'],
      basicDefinition,
      testLexicon,
      mockGenerateWord
    )

    expect(result.phonemic).toBe('kota pako')
    // 'hello' uses explicit orthographic 'cota', 'world' applies orthography to get 'paco'
    expect(result.orthographic).toBe('cota paco')
  })

  it('handles case insensitivity in lookup', () => {
    const result = transformSimplePhrase(
      ['HELLO', 'Hello'],
      basicDefinition,
      testLexicon,
      mockGenerateWord
    )

    expect(result.phonemic).toBe('kota kota')
    expect(result.missing).toHaveLength(0)
  })

  it('handles empty gloss array', () => {
    const result = transformSimplePhrase(
      [],
      basicDefinition,
      testLexicon,
      mockGenerateWord
    )

    expect(result.phonemic).toBe('')
    expect(result.orthographic).toBe('')
    expect(result.missing).toHaveLength(0)
  })

  it('tracks all missing glosses', () => {
    const result = transformSimplePhrase(
      ['unknown1', 'hello', 'unknown2'],
      basicDefinition,
      testLexicon,
      mockGenerateWord
    )

    expect(result.missing).toEqual(['unknown1', 'unknown2'])
  })
})

