/**
 * Custom writing system / script support
 */

export interface Glyph {
  id: string
  name: string
  svg: string              // SVG content (can be path data or full SVG)
  width?: number           // Glyph width for spacing
  height?: number          // Glyph height
  baseline?: number        // Baseline offset
}

export interface GlyphMapping {
  glyph: string           // Glyph ID
  phoneme?: string        // Phoneme this glyph represents
  grapheme?: string       // Grapheme this glyph represents (if different from phoneme)
  isDefault?: boolean     // Use this glyph when no specific mapping exists
}

export interface WritingSystem {
  id: string
  name: string
  direction: 'ltr' | 'rtl' | 'ttb' | 'btt'  // Text direction
  type: 'alphabet' | 'syllabary' | 'logographic' | 'abjad' | 'abugida'
  glyphs: Glyph[]
  mappings: GlyphMapping[]
  defaultGlyphSize: number  // Default size for rendering
  spacing: number           // Space between glyphs
  lineHeight: number        // Line height multiplier
}

export interface ScriptConfig {
  writingSystem?: WritingSystem
  showPhonemic?: boolean    // Show phonemic transcription
  showOrthographic?: boolean // Show orthographic form
  fontSize?: number          // Font size for rendering
}

// Built-in geometric glyph generator for placeholder/demo purposes
export function generateGeometricGlyph(seed: number): string {
  const shapes = [
    // Circle
    '<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="3"/>',
    // Square
    '<rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" stroke-width="3"/>',
    // Triangle
    '<polygon points="50,10 90,90 10,90" fill="none" stroke="currentColor" stroke-width="3"/>',
    // Diamond
    '<polygon points="50,10 90,50 50,90 10,50" fill="none" stroke="currentColor" stroke-width="3"/>',
    // Cross
    '<path d="M50,10 L50,90 M10,50 L90,50" fill="none" stroke="currentColor" stroke-width="3"/>',
    // Arc
    '<path d="M10,50 Q50,10 90,50" fill="none" stroke="currentColor" stroke-width="3"/>',
    // Wave
    '<path d="M10,50 Q30,20 50,50 T90,50" fill="none" stroke="currentColor" stroke-width="3"/>',
    // Zigzag
    '<path d="M10,50 L30,20 L50,50 L70,20 L90,50" fill="none" stroke="currentColor" stroke-width="3"/>',
  ]
  
  const decorations = [
    '',
    '<circle cx="50" cy="50" r="5" fill="currentColor"/>',
    '<line x1="50" y1="10" x2="50" y2="30" stroke="currentColor" stroke-width="2"/>',
    '<circle cx="50" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="2"/>',
    '<rect x="40" y="40" width="20" height="20" fill="currentColor"/>',
  ]
  
  // Use seed to deterministically pick shape and decoration
  const shapeIndex = Math.abs(seed) % shapes.length
  const decorIndex = Math.abs(Math.floor(seed / 10)) % decorations.length
  
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    ${shapes[shapeIndex]}
    ${decorations[decorIndex]}
  </svg>`
}

// Generate a set of placeholder glyphs for a phoneme inventory
export function generatePlaceholderGlyphs(
  phonemes: string[],
  namePrefix: string = 'glyph'
): Glyph[] {
  return phonemes.map((phoneme, index) => ({
    id: `${namePrefix}-${phoneme}`,
    name: phoneme,
    svg: generateGeometricGlyph(phoneme.charCodeAt(0) * 100 + index),
    width: 100,
    height: 100,
  }))
}

// Create default mappings for phonemes
export function createDefaultMappings(
  glyphs: Glyph[],
  phonemes: string[]
): GlyphMapping[] {
  return phonemes.map(phoneme => {
    const glyph = glyphs.find(g => g.name === phoneme)
    return {
      glyph: glyph?.id || '',
      phoneme,
      grapheme: phoneme,
    }
  }).filter(m => m.glyph)
}

// Render text using the writing system
export function renderTextAsGlyphs(
  text: string,
  writingSystem: WritingSystem
): Array<{ glyphId: string; char: string }> {
  const result: Array<{ glyphId: string; char: string }> = []
  
  // Sort mappings by length (longest first) for multi-character graphemes
  const sortedMappings = [...writingSystem.mappings].sort((a, b) => {
    const aLen = (a.grapheme || a.phoneme || '').length
    const bLen = (b.grapheme || b.phoneme || '').length
    return bLen - aLen
  })
  
  let i = 0
  while (i < text.length) {
    let matched = false
    
    // Try to match mappings
    for (const mapping of sortedMappings) {
      const key = mapping.grapheme || mapping.phoneme || ''
      if (text.slice(i).startsWith(key)) {
        result.push({ glyphId: mapping.glyph, char: key })
        i += key.length
        matched = true
        break
      }
    }
    
    // If no mapping found, use the character as-is (for spaces, punctuation, etc.)
    if (!matched) {
      result.push({ glyphId: '', char: text[i] })
      i++
    }
  }
  
  return result
}

// Create an empty writing system
export function createEmptyWritingSystem(name: string = 'New Script'): WritingSystem {
  return {
    id: `script-${Date.now()}`,
    name,
    direction: 'ltr',
    type: 'alphabet',
    glyphs: [],
    mappings: [],
    defaultGlyphSize: 32,
    spacing: 4,
    lineHeight: 1.5,
  }
}

// Export writing system as JSON
export function exportWritingSystem(writingSystem: WritingSystem): string {
  return JSON.stringify(writingSystem, null, 2)
}

// Import writing system from JSON
export function importWritingSystem(json: string): WritingSystem | null {
  try {
    const data = JSON.parse(json)
    if (data.id && data.name && Array.isArray(data.glyphs)) {
      return data as WritingSystem
    }
    return null
  } catch {
    return null
  }
}

