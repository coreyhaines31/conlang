import { describe, it, expect } from 'vitest'
import {
  applyAffix,
  applyAffixes,
  createCompound,
  applySyntax,
  positionAdjective,
  createEmptyMorphologyConfig,
  DEFAULT_SYNTAX,
  AFFIX_PRESETS,
  Affix,
  CompoundRule,
} from './morphology'

describe('applyAffix', () => {
  describe('prefix', () => {
    it('adds prefix to the beginning of word', () => {
      const affix: Affix = {
        id: 'neg',
        type: 'prefix',
        form: 'un-',
        category: 'negation',
        value: 'not',
      }
      expect(applyAffix('happy', affix)).toBe('unhappy')
    })

    it('handles prefix without dash', () => {
      const affix: Affix = {
        id: 'neg',
        type: 'prefix',
        form: 'un',
        category: 'negation',
        value: 'not',
      }
      expect(applyAffix('happy', affix)).toBe('unhappy')
    })
  })

  describe('suffix', () => {
    it('adds suffix to the end of word', () => {
      const affix: Affix = {
        id: 'plural',
        type: 'suffix',
        form: '-s',
        category: 'number',
        value: 'plural',
      }
      expect(applyAffix('cat', affix)).toBe('cats')
    })

    it('handles suffix without dash', () => {
      const affix: Affix = {
        id: 'past',
        type: 'suffix',
        form: 'ed',
        category: 'tense',
        value: 'past',
      }
      expect(applyAffix('walk', affix)).toBe('walked')
    })
  })

  describe('infix', () => {
    it('inserts after first vowel', () => {
      const affix: Affix = {
        id: 'infix',
        type: 'infix',
        form: '-um-',
        category: 'tense',
        value: 'progressive',
      }
      // 'kata' -> insert 'um' after first vowel 'a' -> 'kaumta'
      expect(applyAffix('kata', affix)).toBe('kaumta')
    })

    it('falls back to suffix when no vowel found', () => {
      const affix: Affix = {
        id: 'infix',
        type: 'infix',
        form: '-x-',
        category: 'tense',
        value: 'test',
      }
      expect(applyAffix('bcdfg', affix)).toBe('bcdfgx')
    })
  })

  describe('circumfix', () => {
    it('wraps word with prefix and suffix', () => {
      const affix: Affix = {
        id: 'past-participle',
        type: 'circumfix',
        form: 'ge+t',
        category: 'tense',
        value: 'past-participle',
      }
      // Form 'ge+t' splits into 'ge' + word + 't'
      expect(applyAffix('mach', affix)).toBe('gemacht')
    })

    it('handles circumfix without proper split', () => {
      const affix: Affix = {
        id: 'test',
        type: 'circumfix',
        form: 'pre',
        category: 'tense',
        value: 'test',
      }
      expect(applyAffix('word', affix)).toBe('preword')
    })
  })
})

describe('applyAffixes', () => {
  it('applies multiple affixes in priority order', () => {
    const affixes: Affix[] = [
      { id: 'suffix1', type: 'suffix', form: '-a', category: 'case', value: 'nom', priority: 20 },
      { id: 'prefix1', type: 'prefix', form: 'un-', category: 'negation', value: 'not', priority: 10 },
    ]
    // Priority 10 first (prefix), then priority 20 (suffix)
    expect(applyAffixes('word', affixes)).toBe('unworda')
  })

  it('handles affixes without priority', () => {
    const affixes: Affix[] = [
      { id: 'suffix1', type: 'suffix', form: '-s', category: 'number', value: 'plural' },
      { id: 'suffix2', type: 'suffix', form: '-ed', category: 'tense', value: 'past' },
    ]
    // Both have priority 0, applied in order
    expect(applyAffixes('word', affixes)).toBe('wordsed')
  })

  it('handles empty affix array', () => {
    expect(applyAffixes('word', [])).toBe('word')
  })

  it('applies derivational before inflectional (by priority)', () => {
    const affixes: Affix[] = [
      { id: 'plural', type: 'suffix', form: '-s', category: 'number', value: 'plural', priority: 10 },
      { id: 'dim', type: 'suffix', form: '-ling', category: 'diminutive', value: 'small', priority: 1 },
    ]
    // Diminutive (priority 1) before plural (priority 10)
    expect(applyAffixes('duck', affixes)).toBe('ducklings')
  })
})

describe('createCompound', () => {
  it('joins words without connector', () => {
    const rule: CompoundRule = {
      id: 'noun-noun',
      name: 'Noun + Noun',
      pattern: ['noun', 'noun'],
      headPosition: 'last',
    }
    expect(createCompound(['sun', 'flower'], rule)).toBe('sunflower')
  })

  it('joins words with connector', () => {
    const rule: CompoundRule = {
      id: 'noun-noun',
      name: 'Noun + Noun',
      pattern: ['noun', 'noun'],
      headPosition: 'last',
      connector: '-',
    }
    expect(createCompound(['mother', 'in', 'law'], rule)).toBe('mother-in-law')
  })

  it('handles single word', () => {
    const rule: CompoundRule = {
      id: 'single',
      name: 'Single',
      pattern: ['noun'],
      headPosition: 'first',
    }
    expect(createCompound(['word'], rule)).toBe('word')
  })
})

describe('applySyntax', () => {
  it('applies SVO word order', () => {
    expect(applySyntax('I', 'see', 'you', 'SVO')).toBe('I see you')
  })

  it('applies SOV word order', () => {
    expect(applySyntax('I', 'see', 'you', 'SOV')).toBe('I you see')
  })

  it('applies VSO word order', () => {
    expect(applySyntax('I', 'see', 'you', 'VSO')).toBe('see I you')
  })

  it('applies VOS word order', () => {
    expect(applySyntax('I', 'see', 'you', 'VOS')).toBe('see you I')
  })

  it('applies OSV word order', () => {
    expect(applySyntax('I', 'see', 'you', 'OSV')).toBe('you I see')
  })

  it('applies OVS word order', () => {
    expect(applySyntax('I', 'see', 'you', 'OVS')).toBe('you see I')
  })

  it('applies free word order as SVO', () => {
    expect(applySyntax('I', 'see', 'you', 'free')).toBe('I see you')
  })

  it('handles empty components', () => {
    expect(applySyntax('I', 'see', '', 'SVO')).toBe('I see')
    expect(applySyntax('', 'see', 'you', 'SVO')).toBe('see you')
  })
})

describe('positionAdjective', () => {
  it('positions adjective before noun', () => {
    expect(positionAdjective('big', 'house', 'before')).toBe('big house')
  })

  it('positions adjective after noun', () => {
    expect(positionAdjective('grande', 'casa', 'after')).toBe('casa grande')
  })
})

describe('createEmptyMorphologyConfig', () => {
  it('returns empty config with default syntax', () => {
    const config = createEmptyMorphologyConfig()
    
    expect(config.affixes).toEqual([])
    expect(config.compoundRules).toEqual([])
    expect(config.syntax).toEqual(DEFAULT_SYNTAX)
  })

  it('returns a new object each time', () => {
    const config1 = createEmptyMorphologyConfig()
    const config2 = createEmptyMorphologyConfig()
    
    expect(config1).not.toBe(config2)
    expect(config1.syntax).not.toBe(config2.syntax)
  })
})

describe('DEFAULT_SYNTAX', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_SYNTAX.wordOrder).toBe('SVO')
    expect(DEFAULT_SYNTAX.adjectivePosition).toBe('before')
    expect(DEFAULT_SYNTAX.adpositionType).toBe('preposition')
    expect(DEFAULT_SYNTAX.hasArticles).toBe(true)
  })
})

describe('AFFIX_PRESETS', () => {
  it('has basic-number preset with plural and dual', () => {
    const preset = AFFIX_PRESETS['basic-number']
    
    expect(preset).toBeDefined()
    expect(preset.some(a => a.value === 'plural')).toBe(true)
    expect(preset.some(a => a.value === 'dual')).toBe(true)
  })

  it('has basic-tense preset with past and future', () => {
    const preset = AFFIX_PRESETS['basic-tense']
    
    expect(preset).toBeDefined()
    expect(preset.some(a => a.value === 'past')).toBe(true)
    expect(preset.some(a => a.value === 'future')).toBe(true)
  })

  it('presets have valid structure', () => {
    for (const [name, affixes] of Object.entries(AFFIX_PRESETS)) {
      for (const affix of affixes) {
        expect(affix.id).toBeDefined()
        expect(affix.type).toMatch(/^(prefix|suffix|infix|circumfix)$/)
        expect(affix.form).toBeDefined()
        expect(affix.category).toBeDefined()
        expect(affix.value).toBeDefined()
      }
    }
  })
})

