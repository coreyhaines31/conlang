import { describe, expect, it } from 'vitest'
import { parseImportedLexicon } from './lexicon-import'

describe('parseImportedLexicon', () => {
  it('keeps the fields of exported entries and drops database ids', () => {
    const exported = [
      {
        id: 'abc',
        languageId: 'lang-1',
        gloss: 'water',
        partOfSpeech: 'noun',
        phonemicForm: '/aka/',
        orthographicForm: 'aka',
        tags: ['nature'],
        notes: 'common',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    expect(parseImportedLexicon(exported)).toEqual([
      {
        gloss: 'water',
        partOfSpeech: 'noun',
        phonemicForm: '/aka/',
        orthographicForm: 'aka',
        tags: ['nature'],
        notes: 'common',
      },
    ])
  })

  it('returns an empty list when the file has no lexicon', () => {
    expect(parseImportedLexicon(undefined)).toEqual([])
    expect(parseImportedLexicon({ gloss: 'water' })).toEqual([])
  })

  it('skips malformed entries and normalizes optional fields', () => {
    const result = parseImportedLexicon([
      null,
      'water',
      { gloss: '' },
      { gloss: 42 },
      { gloss: 'fire', partOfSpeech: '', phonemicForm: 7, tags: ['hot', 3] },
    ])

    expect(result).toEqual([
      {
        gloss: 'fire',
        partOfSpeech: null,
        phonemicForm: null,
        orthographicForm: null,
        tags: ['hot'],
        notes: null,
      },
    ])
  })

  it('caps very large lexicons', () => {
    const huge = Array.from({ length: 6000 }, (_, i) => ({ gloss: `word${i}` }))
    expect(parseImportedLexicon(huge)).toHaveLength(5000)
  })
})
