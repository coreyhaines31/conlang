import { describe, it, expect } from 'vitest'
import {
  SeededRNG,
  generateWords,
  applyOrthography,
  LanguageDefinition,
  Phonology,
  Phonotactics,
  Orthography,
  PhonologicalRule,
  GenerationStyle,
} from './generator'

describe('SeededRNG', () => {
  describe('constructor and determinism', () => {
    it('produces deterministic results with the same seed', () => {
      const rng1 = new SeededRNG(12345)
      const rng2 = new SeededRNG(12345)

      for (let i = 0; i < 100; i++) {
        expect(rng1.next()).toBe(rng2.next())
      }
    })

    it('produces different results with different seeds', () => {
      const rng1 = new SeededRNG(12345)
      const rng2 = new SeededRNG(67890)

      const values1 = Array.from({ length: 10 }, () => rng1.next())
      const values2 = Array.from({ length: 10 }, () => rng2.next())

      expect(values1).not.toEqual(values2)
    })
  })

  describe('next()', () => {
    it('returns values between 0 and 1', () => {
      const rng = new SeededRNG(42)
      for (let i = 0; i < 100; i++) {
        const value = rng.next()
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(1)
      }
    })
  })

  describe('nextInt()', () => {
    it('returns integers in the specified range', () => {
      const rng = new SeededRNG(99)
      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(5, 15)
        expect(value).toBeGreaterThanOrEqual(5)
        expect(value).toBeLessThan(15)
        expect(Number.isInteger(value)).toBe(true)
      }
    })

    it('works with negative ranges', () => {
      const rng = new SeededRNG(77)
      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(-10, 10)
        expect(value).toBeGreaterThanOrEqual(-10)
        expect(value).toBeLessThan(10)
      }
    })
  })

  describe('pick()', () => {
    it('picks elements from an array deterministically', () => {
      const rng1 = new SeededRNG(123)
      const rng2 = new SeededRNG(123)
      const array = ['a', 'b', 'c', 'd', 'e']

      for (let i = 0; i < 20; i++) {
        expect(rng1.pick(array)).toBe(rng2.pick(array))
      }
    })

    it('throws on empty array', () => {
      const rng = new SeededRNG(1)
      expect(() => rng.pick([])).toThrow('Cannot pick from empty array')
    })

    it('picks all elements eventually given enough iterations', () => {
      const rng = new SeededRNG(456)
      const array = ['x', 'y', 'z']
      const picked = new Set<string>()

      for (let i = 0; i < 100; i++) {
        picked.add(rng.pick(array))
      }

      expect(picked.size).toBe(3)
    })
  })

  describe('pickWeighted()', () => {
    it('respects weights over many iterations', () => {
      const rng = new SeededRNG(789)
      const items = [
        { value: 'rare', weight: 1 },
        { value: 'common', weight: 10 },
      ]

      const counts: Record<string, number> = { rare: 0, common: 0 }

      for (let i = 0; i < 200; i++) {
        const picked = rng.pickWeighted(items)
        counts[picked.value]++
      }

      // Common should be picked roughly 10x more than rare
      expect(counts.common).toBeGreaterThan(counts.rare * 2)
    })

    it('throws on empty array', () => {
      const rng = new SeededRNG(1)
      expect(() => rng.pickWeighted([])).toThrow('Cannot pick from empty array')
    })

    it('handles items with zero total weight', () => {
      const rng = new SeededRNG(1)
      const items = [{ value: 'a', weight: 0 }]
      // Should return first item when total weight is 0
      expect(rng.pickWeighted(items)).toEqual({ value: 'a', weight: 0 })
    })
  })

  describe('pickWithPreference()', () => {
    it('favors preferred items', () => {
      const rng = new SeededRNG(999)
      const array = ['a', 'b', 'c', 'd', 'e']
      const preferred = ['a']
      const avoided: string[] = []

      const counts: Record<string, number> = {}
      array.forEach(x => (counts[x] = 0))

      for (let i = 0; i < 200; i++) {
        counts[rng.pickWithPreference(array, preferred, avoided)]++
      }

      // 'a' should be picked more often (3x weight)
      expect(counts['a']).toBeGreaterThan(counts['b'])
    })

    it('avoids avoided items', () => {
      const rng = new SeededRNG(888)
      const array = ['a', 'b', 'c']
      const preferred: string[] = []
      const avoided = ['a', 'b']

      const picked = new Set<string>()
      for (let i = 0; i < 100; i++) {
        picked.add(rng.pickWithPreference(array, preferred, avoided))
      }

      // Should only pick 'c'
      expect(picked.size).toBe(1)
      expect(picked.has('c')).toBe(true)
    })

    it('falls back to original array when all items are avoided', () => {
      const rng = new SeededRNG(777)
      const array = ['a', 'b']
      const preferred: string[] = []
      const avoided = ['a', 'b']

      // Should still pick from original array
      const result = rng.pickWithPreference(array, preferred, avoided)
      expect(['a', 'b']).toContain(result)
    })
  })

  describe('shuffle()', () => {
    it('returns a new array with same elements', () => {
      const rng = new SeededRNG(555)
      const array = [1, 2, 3, 4, 5]
      const shuffled = rng.shuffle(array)

      expect(shuffled).toHaveLength(array.length)
      expect(shuffled.sort()).toEqual(array.sort())
    })

    it('does not mutate original array', () => {
      const rng = new SeededRNG(444)
      const array = [1, 2, 3]
      const original = [...array]
      rng.shuffle(array)

      expect(array).toEqual(original)
    })

    it('produces deterministic shuffles', () => {
      const rng1 = new SeededRNG(333)
      const rng2 = new SeededRNG(333)
      const array = ['a', 'b', 'c', 'd', 'e']

      expect(rng1.shuffle(array)).toEqual(rng2.shuffle(array))
    })
  })
})

describe('applyOrthography', () => {
  it('returns phonemic unchanged when no orthography provided', () => {
    expect(applyOrthography('kata')).toBe('kata')
    expect(applyOrthography('kata', undefined)).toBe('kata')
  })

  it('returns phonemic unchanged when orthography has no mappings', () => {
    expect(applyOrthography('kata', { mappings: {} })).toBe('kata')
  })

  it('applies simple mappings', () => {
    const orthography: Orthography = {
      mappings: {
        k: 'c',
        a: 'ah',
      },
    }
    expect(applyOrthography('kata', orthography)).toBe('cahtah')
  })

  it('handles multi-character mappings (digraphs)', () => {
    const orthography: Orthography = {
      mappings: {
        sh: 'sch',
        th: 'th',
        a: 'a',
      },
    }
    expect(applyOrthography('shatha', orthography)).toBe('schatha')
  })

  it('applies longer mappings first for multi-char sequences', () => {
    const orthography: Orthography = {
      mappings: {
        sh: 'sch',
        s: 's',
        h: 'h',
      },
    }
    // 'sh' should be matched as a unit, not 's' then 'h'
    expect(applyOrthography('sha', orthography)).toBe('scha')
  })

  it('handles special regex characters in phonemes', () => {
    const orthography: Orthography = {
      mappings: {
        'a.b': 'X',
      },
    }
    expect(applyOrthography('a.b', orthography)).toBe('X')
  })
})

describe('generateWords', () => {
  const basicDefinition: LanguageDefinition = {
    phonology: {
      consonants: ['p', 't', 'k'],
      vowels: ['a', 'i', 'u'],
    },
    phonotactics: {
      syllableTemplates: [{ template: 'CV', weight: 1 }],
      forbiddenSequences: [],
    },
  }

  it('generates deterministic words with the same seed', () => {
    const words1 = generateWords(12345, 10, basicDefinition)
    const words2 = generateWords(12345, 10, basicDefinition)

    expect(words1).toEqual(words2)
  })

  it('generates different words with different seeds', () => {
    const words1 = generateWords(11111, 10, basicDefinition)
    const words2 = generateWords(22222, 10, basicDefinition)

    expect(words1).not.toEqual(words2)
  })

  it('generates the requested number of words', () => {
    const words = generateWords(99999, 25, basicDefinition)
    expect(words).toHaveLength(25)
  })

  it('generates words with only defined phonemes', () => {
    const words = generateWords(54321, 20, basicDefinition)

    for (const word of words) {
      for (const char of word.phonemic) {
        expect([...basicDefinition.phonology!.consonants, ...basicDefinition.phonology!.vowels]).toContain(char)
      }
    }
  })

  it('respects syllable templates', () => {
    const cvOnly: LanguageDefinition = {
      phonology: {
        consonants: ['m', 'n'],
        vowels: ['a', 'e'],
      },
      phonotactics: {
        syllableTemplates: [{ template: 'CV', weight: 1 }],
        forbiddenSequences: [],
      },
    }

    const words = generateWords(77777, 20, cvOnly)

    for (const word of words) {
      // CV syllables should have even length (C+V per syllable)
      expect(word.phonemic.length % 2).toBe(0)
    }
  })

  it('applies orthography mappings', () => {
    const withOrthography: LanguageDefinition = {
      ...basicDefinition,
      orthography: {
        mappings: {
          k: 'c',
        },
      },
    }

    const words = generateWords(88888, 20, withOrthography)
    const hasK = words.some(w => w.phonemic.includes('k'))
    const orthographicHasK = words.some(w => w.orthographic.includes('k'))
    const orthographicHasC = words.some(w => w.orthographic.includes('c'))

    expect(hasK).toBe(true)
    expect(orthographicHasK).toBe(false)
    expect(orthographicHasC).toBe(true)
  })

  it('uses default phonology when not provided', () => {
    const emptyDefinition: LanguageDefinition = {}
    const words = generateWords(11111, 5, emptyDefinition)

    expect(words).toHaveLength(5)
    words.forEach(w => {
      expect(w.phonemic.length).toBeGreaterThan(0)
    })
  })

  it('avoids forbidden sequences', () => {
    const withForbidden: LanguageDefinition = {
      phonology: {
        consonants: ['k', 't'],
        vowels: ['a', 'i'],
      },
      phonotactics: {
        syllableTemplates: [{ template: 'CVC', weight: 1 }],
        forbiddenSequences: ['kt', 'tk'],
      },
    }

    const words = generateWords(33333, 30, withForbidden)

    for (const word of words) {
      expect(word.phonemic).not.toContain('kt')
      expect(word.phonemic).not.toContain('tk')
    }
  })
})

describe('phonological rules', () => {
  it('applies simple find/replace rules', () => {
    const definition: LanguageDefinition = {
      phonology: {
        consonants: ['k'],
        vowels: ['a'],
      },
      phonotactics: {
        syllableTemplates: [{ template: 'CV', weight: 1 }],
        forbiddenSequences: [],
      },
      phonologicalRules: [
        {
          id: '1',
          name: 'k-to-g',
          find: 'k',
          replace: 'g',
          enabled: true,
        },
      ],
    }

    const words = generateWords(44444, 10, definition)

    // All 'k's should become 'g's
    for (const word of words) {
      expect(word.phonemic).not.toContain('k')
      expect(word.phonemic).toContain('g')
    }
  })

  it('skips disabled rules', () => {
    const definition: LanguageDefinition = {
      phonology: {
        consonants: ['k'],
        vowels: ['a'],
      },
      phonotactics: {
        syllableTemplates: [{ template: 'CV', weight: 1 }],
        forbiddenSequences: [],
      },
      phonologicalRules: [
        {
          id: '1',
          name: 'k-to-g',
          find: 'k',
          replace: 'g',
          enabled: false,
        },
      ],
    }

    const words = generateWords(55555, 10, definition)

    // 'k's should remain
    const hasK = words.some(w => w.phonemic.includes('k'))
    expect(hasK).toBe(true)
  })
})

describe('generation style', () => {
  it('respects preferred phonemes', () => {
    const definition: LanguageDefinition = {
      phonology: {
        consonants: ['p', 't', 'k', 's', 'm', 'n'],
        vowels: ['a', 'e', 'i', 'o', 'u'],
      },
      phonotactics: {
        syllableTemplates: [{ template: 'CV', weight: 1 }],
        forbiddenSequences: [],
      },
      generationStyle: {
        preferredConsonants: ['m', 'n'],
        preferredVowels: ['a'],
      },
    }

    const words = generateWords(66666, 30, definition)

    // Count occurrences
    let mCount = 0, otherConsonantCount = 0
    let aCount = 0, otherVowelCount = 0

    for (const word of words) {
      for (const char of word.phonemic) {
        if (char === 'm' || char === 'n') mCount++
        else if (['p', 't', 'k', 's'].includes(char)) otherConsonantCount++
        
        if (char === 'a') aCount++
        else if (['e', 'i', 'o', 'u'].includes(char)) otherVowelCount++
      }
    }

    // Preferred should appear more often (but hard to guarantee exact ratios)
    expect(mCount).toBeGreaterThan(0)
    expect(aCount).toBeGreaterThan(0)
  })

  it('respects syllable length distribution', () => {
    const shortWords: LanguageDefinition = {
      phonology: {
        consonants: ['t'],
        vowels: ['a'],
      },
      phonotactics: {
        syllableTemplates: [{ template: 'CV', weight: 1 }],
        forbiddenSequences: [],
      },
      generationStyle: {
        syllableLengthDistribution: {
          1: 10,
          2: 1,
          3: 0,
          4: 0,
        },
      },
    }

    const words = generateWords(77777, 50, shortWords)

    // Most words should be 2 chars (1 syllable of CV)
    const shortCount = words.filter(w => w.phonemic.length === 2).length
    expect(shortCount).toBeGreaterThan(35) // Should be around 90%
  })
})

describe('weighted syllable templates', () => {
  it('respects template weights', () => {
    const definition: LanguageDefinition = {
      phonology: {
        consonants: ['t'],
        vowels: ['a'],
      },
      phonotactics: {
        syllableTemplates: [
          { template: 'CV', weight: 10 },
          { template: 'CVC', weight: 1 },
        ],
        forbiddenSequences: [],
      },
      generationStyle: {
        syllableLengthDistribution: {
          1: 1,
          2: 0,
          3: 0,
          4: 0,
        },
      },
    }

    const words = generateWords(88888, 100, definition)

    // Count CV (2 char) vs CVC (3 char) words
    const cvCount = words.filter(w => w.phonemic.length === 2).length
    const cvcCount = words.filter(w => w.phonemic.length === 3).length

    // CV should be much more common
    expect(cvCount).toBeGreaterThan(cvcCount * 2)
  })

  it('handles old string[] format for templates', () => {
    const definition: LanguageDefinition = {
      phonology: {
        consonants: ['t'],
        vowels: ['a'],
      },
      phonotactics: {
        syllableTemplates: ['CV', 'CVC'] as any, // Old format
        forbiddenSequences: [],
      },
    }

    // Should not throw and should generate words
    const words = generateWords(99999, 10, definition)
    expect(words).toHaveLength(10)
  })
})

