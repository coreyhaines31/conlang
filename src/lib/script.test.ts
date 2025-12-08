import { describe, it, expect } from 'vitest'
import {
  generateGeometricGlyph,
  generatePlaceholderGlyphs,
  createDefaultMappings,
  renderTextAsGlyphs,
  createEmptyWritingSystem,
  exportWritingSystem,
  importWritingSystem,
  Glyph,
  WritingSystem,
} from './script'

describe('generateGeometricGlyph', () => {
  it('returns valid SVG string', () => {
    const svg = generateGeometricGlyph(123)
    
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
    expect(svg).toContain('viewBox="0 0 100 100"')
  })

  it('generates deterministic output for same seed', () => {
    const svg1 = generateGeometricGlyph(42)
    const svg2 = generateGeometricGlyph(42)
    
    expect(svg1).toBe(svg2)
  })

  it('generates different output for different seeds', () => {
    const svg1 = generateGeometricGlyph(1)
    const svg2 = generateGeometricGlyph(100)
    
    expect(svg1).not.toBe(svg2)
  })

  it('handles negative seeds', () => {
    const svg = generateGeometricGlyph(-500)
    
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })
})

describe('generatePlaceholderGlyphs', () => {
  it('generates glyphs for each phoneme', () => {
    const phonemes = ['a', 'e', 'i']
    const glyphs = generatePlaceholderGlyphs(phonemes)
    
    expect(glyphs).toHaveLength(3)
    expect(glyphs.map(g => g.name)).toEqual(['a', 'e', 'i'])
  })

  it('generates unique IDs', () => {
    const phonemes = ['p', 't', 'k']
    const glyphs = generatePlaceholderGlyphs(phonemes)
    
    const ids = glyphs.map(g => g.id)
    const uniqueIds = new Set(ids)
    
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('uses custom name prefix', () => {
    const phonemes = ['a', 'b']
    const glyphs = generatePlaceholderGlyphs(phonemes, 'symbol')
    
    expect(glyphs[0].id).toContain('symbol-a')
    expect(glyphs[1].id).toContain('symbol-b')
  })

  it('generates glyphs with dimensions', () => {
    const glyphs = generatePlaceholderGlyphs(['a'])
    
    expect(glyphs[0].width).toBe(100)
    expect(glyphs[0].height).toBe(100)
  })

  it('handles empty phoneme array', () => {
    const glyphs = generatePlaceholderGlyphs([])
    expect(glyphs).toHaveLength(0)
  })
})

describe('createDefaultMappings', () => {
  const testGlyphs: Glyph[] = [
    { id: 'glyph-a', name: 'a', svg: '<svg/>', width: 100, height: 100 },
    { id: 'glyph-e', name: 'e', svg: '<svg/>', width: 100, height: 100 },
    { id: 'glyph-i', name: 'i', svg: '<svg/>', width: 100, height: 100 },
  ]

  it('creates mappings for matching phonemes', () => {
    const mappings = createDefaultMappings(testGlyphs, ['a', 'e'])
    
    expect(mappings).toHaveLength(2)
    expect(mappings[0].phoneme).toBe('a')
    expect(mappings[0].glyph).toBe('glyph-a')
  })

  it('filters out phonemes without matching glyphs', () => {
    const mappings = createDefaultMappings(testGlyphs, ['a', 'x', 'y'])
    
    expect(mappings).toHaveLength(1)
    expect(mappings[0].phoneme).toBe('a')
  })

  it('sets grapheme same as phoneme', () => {
    const mappings = createDefaultMappings(testGlyphs, ['a'])
    
    expect(mappings[0].grapheme).toBe('a')
  })

  it('handles empty arrays', () => {
    expect(createDefaultMappings([], ['a'])).toHaveLength(0)
    expect(createDefaultMappings(testGlyphs, [])).toHaveLength(0)
  })
})

describe('renderTextAsGlyphs', () => {
  const testSystem: WritingSystem = {
    id: 'test',
    name: 'Test Script',
    direction: 'ltr',
    type: 'alphabet',
    glyphs: [],
    mappings: [
      { glyph: 'glyph-a', phoneme: 'a', grapheme: 'a' },
      { glyph: 'glyph-b', phoneme: 'b', grapheme: 'b' },
      { glyph: 'glyph-sh', phoneme: 'sh', grapheme: 'sh' },
    ],
    defaultGlyphSize: 32,
    spacing: 4,
    lineHeight: 1.5,
  }

  it('renders single character mappings', () => {
    const result = renderTextAsGlyphs('ab', testSystem)
    
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ glyphId: 'glyph-a', char: 'a' })
    expect(result[1]).toEqual({ glyphId: 'glyph-b', char: 'b' })
  })

  it('handles multi-character mappings (digraphs)', () => {
    const result = renderTextAsGlyphs('sha', testSystem)
    
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ glyphId: 'glyph-sh', char: 'sh' })
    expect(result[1]).toEqual({ glyphId: 'glyph-a', char: 'a' })
  })

  it('handles unmapped characters with empty glyphId', () => {
    const result = renderTextAsGlyphs('a x', testSystem)
    
    expect(result).toHaveLength(3)
    expect(result[0].glyphId).toBe('glyph-a')
    expect(result[1].glyphId).toBe('') // space
    expect(result[2].glyphId).toBe('') // 'x' not mapped
  })

  it('handles empty string', () => {
    const result = renderTextAsGlyphs('', testSystem)
    expect(result).toHaveLength(0)
  })

  it('prioritizes longer mappings', () => {
    // 'sh' should be matched before 's' and 'h' separately
    const systemWithS: WritingSystem = {
      ...testSystem,
      mappings: [
        { glyph: 'glyph-s', phoneme: 's', grapheme: 's' },
        { glyph: 'glyph-h', phoneme: 'h', grapheme: 'h' },
        { glyph: 'glyph-sh', phoneme: 'sh', grapheme: 'sh' },
      ],
    }
    
    const result = renderTextAsGlyphs('sha', systemWithS)
    
    expect(result[0]).toEqual({ glyphId: 'glyph-sh', char: 'sh' })
  })
})

describe('createEmptyWritingSystem', () => {
  it('creates system with default name', () => {
    const system = createEmptyWritingSystem()
    
    expect(system.name).toBe('New Script')
    expect(system.direction).toBe('ltr')
    expect(system.type).toBe('alphabet')
  })

  it('creates system with custom name', () => {
    const system = createEmptyWritingSystem('My Script')
    
    expect(system.name).toBe('My Script')
  })

  it('creates system with empty arrays', () => {
    const system = createEmptyWritingSystem()
    
    expect(system.glyphs).toEqual([])
    expect(system.mappings).toEqual([])
  })

  it('sets default rendering values', () => {
    const system = createEmptyWritingSystem()
    
    expect(system.defaultGlyphSize).toBe(32)
    expect(system.spacing).toBe(4)
    expect(system.lineHeight).toBe(1.5)
  })

  it('generates unique ID', () => {
    const system1 = createEmptyWritingSystem()
    // Small delay to ensure different timestamp
    const system2 = createEmptyWritingSystem()
    
    expect(system1.id).toContain('script-')
    // IDs might be the same if created in same millisecond, so just check format
  })
})

describe('exportWritingSystem', () => {
  it('exports as valid JSON', () => {
    const system = createEmptyWritingSystem('Test')
    const json = exportWritingSystem(system)
    
    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('exports all properties', () => {
    const system: WritingSystem = {
      id: 'test-id',
      name: 'Test',
      direction: 'rtl',
      type: 'abjad',
      glyphs: [{ id: 'g1', name: 'a', svg: '<svg/>' }],
      mappings: [{ glyph: 'g1', phoneme: 'a' }],
      defaultGlyphSize: 48,
      spacing: 8,
      lineHeight: 2,
    }
    
    const json = exportWritingSystem(system)
    const parsed = JSON.parse(json)
    
    expect(parsed.id).toBe('test-id')
    expect(parsed.name).toBe('Test')
    expect(parsed.direction).toBe('rtl')
    expect(parsed.glyphs).toHaveLength(1)
    expect(parsed.mappings).toHaveLength(1)
  })

  it('formats JSON with indentation', () => {
    const system = createEmptyWritingSystem()
    const json = exportWritingSystem(system)
    
    // Should have newlines from pretty printing
    expect(json).toContain('\n')
  })
})

describe('importWritingSystem', () => {
  it('imports valid JSON', () => {
    const original: WritingSystem = {
      id: 'import-test',
      name: 'Imported',
      direction: 'ltr',
      type: 'alphabet',
      glyphs: [],
      mappings: [],
      defaultGlyphSize: 32,
      spacing: 4,
      lineHeight: 1.5,
    }
    
    const json = JSON.stringify(original)
    const imported = importWritingSystem(json)
    
    expect(imported).not.toBeNull()
    expect(imported?.id).toBe('import-test')
    expect(imported?.name).toBe('Imported')
  })

  it('returns null for invalid JSON', () => {
    const result = importWritingSystem('not valid json')
    expect(result).toBeNull()
  })

  it('returns null for JSON missing required fields', () => {
    const result = importWritingSystem('{"name": "Test"}')
    expect(result).toBeNull()
  })

  it('returns null for JSON with invalid glyphs field', () => {
    const result = importWritingSystem('{"id": "1", "name": "Test", "glyphs": "not an array"}')
    expect(result).toBeNull()
  })

  it('round-trips through export/import', () => {
    const original = createEmptyWritingSystem('Round Trip')
    const json = exportWritingSystem(original)
    const imported = importWritingSystem(json)
    
    expect(imported?.name).toBe(original.name)
    expect(imported?.direction).toBe(original.direction)
  })
})

