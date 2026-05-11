import { describe, it, expect } from 'vitest'
import {
  sanitizeGlyphSvg,
  sanitizeWritingSystem,
  sanitizeLanguageDefinition,
} from './sanitize-svg'

describe('sanitizeGlyphSvg', () => {
  it('preserves legitimate glyph markup', () => {
    const safe =
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M10 10 L 90 90" stroke="currentColor" stroke-width="3" fill="none"/>' +
      '<circle cx="50" cy="50" r="40" fill="currentColor"/>' +
      '</svg>'
    expect(sanitizeGlyphSvg(safe)).toBe(safe)
  })

  it('strips <script> tags and their bodies', () => {
    const dirty = '<svg><script>alert(1)</script><path d="M0 0"/></svg>'
    const clean = sanitizeGlyphSvg(dirty)
    expect(clean).not.toMatch(/script/i)
    expect(clean).toContain('<path d="M0 0"/>')
  })

  it('strips inline event handlers from any element', () => {
    const dirty = '<svg onload="alert(1)"><path d="M0 0" onclick="alert(2)"/></svg>'
    const clean = sanitizeGlyphSvg(dirty)
    expect(clean).not.toMatch(/onload/i)
    expect(clean).not.toMatch(/onclick/i)
  })

  it('strips <foreignObject>', () => {
    const dirty =
      '<svg><foreignObject><iframe src="https://evil.example"></iframe></foreignObject></svg>'
    const clean = sanitizeGlyphSvg(dirty)
    expect(clean).not.toMatch(/foreignObject/i)
    expect(clean).not.toMatch(/iframe/i)
  })

  it('neutralizes javascript: URLs in href attributes', () => {
    const dirty = '<svg><a href="javascript:alert(1)"><path d="M0 0"/></a></svg>'
    const clean = sanitizeGlyphSvg(dirty)
    expect(clean).not.toMatch(/javascript:/i)
    expect(clean).not.toMatch(/<a\b/i)
  })

  it('neutralizes xlink:href javascript: URLs', () => {
    const dirty = '<svg><use xlink:href="javascript:alert(1)"/></svg>'
    const clean = sanitizeGlyphSvg(dirty)
    expect(clean).not.toMatch(/javascript:/i)
    expect(clean).not.toMatch(/<use/i)
  })

  it('strips DOCTYPE and XML processing instructions', () => {
    const dirty = '<?xml version="1.0"?><!DOCTYPE svg><svg><path d="M0 0"/></svg>'
    const clean = sanitizeGlyphSvg(dirty)
    expect(clean.startsWith('<svg')).toBe(true)
    expect(clean).not.toMatch(/DOCTYPE/i)
    expect(clean).not.toMatch(/\?xml/i)
  })

  it('strips style attributes', () => {
    const dirty = '<svg><path style="background:url(x)" d="M0 0"/></svg>'
    expect(sanitizeGlyphSvg(dirty)).not.toMatch(/style\s*=/i)
  })

  it('strips <animate>, <set> and other SVG-only script vectors', () => {
    const dirty =
      '<svg><animate attributeName="href" to="javascript:alert(1)"/></svg>'
    const clean = sanitizeGlyphSvg(dirty)
    expect(clean).not.toMatch(/animate/i)
    expect(clean).not.toMatch(/javascript:/i)
  })

  it('strips <image> tag (can fetch arbitrary URLs)', () => {
    const dirty = '<svg><image href="https://attacker.example/x"/></svg>'
    expect(sanitizeGlyphSvg(dirty)).not.toMatch(/<image/i)
  })

  it('returns empty string for non-string input', () => {
    expect(sanitizeGlyphSvg(null)).toBe('')
    expect(sanitizeGlyphSvg(undefined)).toBe('')
    expect(sanitizeGlyphSvg(123)).toBe('')
    expect(sanitizeGlyphSvg({ svg: '<svg/>' })).toBe('')
  })

  it('is idempotent', () => {
    const dirty = '<svg onload="alert(1)"><script>x</script><path d="M0 0"/></svg>'
    const once = sanitizeGlyphSvg(dirty)
    const twice = sanitizeGlyphSvg(once)
    expect(once).toBe(twice)
  })

  describe('attribute-separator bypasses (codex finding)', () => {
    // HTML parses `/` as an attribute-name separator. Anchoring strippers
    // only on whitespace lets <img/onerror=...> through. These tests pin
    // the fix in place.
    it('strips event handlers separated by `/` from the tag name', () => {
      const dirty = '<svg></svg><img/onerror=alert(1) src=x>'
      const clean = sanitizeGlyphSvg(dirty)
      expect(clean).not.toMatch(/onerror/i)
      // HTML <img> is also stripped because it has no business in glyph SVG.
      expect(clean).not.toMatch(/<img\b/i)
    })

    it('strips event handlers separated by `/` from a previous attribute', () => {
      const dirty = '<svg><path d="M0 0"/onmouseover=alert(1)></svg>'
      const clean = sanitizeGlyphSvg(dirty)
      expect(clean).not.toMatch(/onmouseover/i)
    })

    it('strips <img> with data: src + onload handler', () => {
      const dirty =
        '<svg></svg><img/onload=alert(1) src=data:image/gif;base64,R0lGODlhAQABAAAAACw=>'
      const clean = sanitizeGlyphSvg(dirty)
      expect(clean).not.toMatch(/onload/i)
      expect(clean).not.toMatch(/<img\b/i)
    })

    it('strips event handlers preceded by tab or newline (not just space)', () => {
      const dirty = '<svg\tonload="x()"\nonclick="y()"><path d="M0 0"/></svg>'
      const clean = sanitizeGlyphSvg(dirty)
      expect(clean).not.toMatch(/onload/i)
      expect(clean).not.toMatch(/onclick/i)
    })

    it('strips standalone HTML elements that can fire events', () => {
      const dirty = '<svg></svg><body onload=alert(1)>'
      const clean = sanitizeGlyphSvg(dirty)
      expect(clean).not.toMatch(/<body\b/i)
      expect(clean).not.toMatch(/onload/i)
    })

    it('strips <video> / <audio> auto-event vectors', () => {
      expect(sanitizeGlyphSvg('<svg></svg><video src=x onerror=alert(1)>')).not.toMatch(
        /<video\b/i
      )
      expect(sanitizeGlyphSvg('<svg></svg><audio src=x onerror=alert(1)>')).not.toMatch(
        /<audio\b/i
      )
    })

    it('strips namespaced on* handlers (xlink:onclick, xml:onload)', () => {
      const clean = sanitizeGlyphSvg(
        '<svg xlink:onclick="alert(1)" xml:onload="alert(2)"><path d="M0 0"/></svg>'
      )
      expect(clean).not.toMatch(/onclick/i)
      expect(clean).not.toMatch(/onload/i)
    })

    it('strips handlers inside <symbol> / <title> / <desc>', () => {
      const clean = sanitizeGlyphSvg(
        '<svg><symbol id="x" onload="x()"><path d="M0 0"/></symbol><title onfocus="y()">hi</title></svg>'
      )
      expect(clean).not.toMatch(/onload/i)
      expect(clean).not.toMatch(/onfocus/i)
    })

    it('preserves legitimate path/attribute data even when it contains "on" substrings', () => {
      const clean = sanitizeGlyphSvg('<svg><path d="M0 0 L 10 10"/></svg>')
      expect(clean).toContain('d="M0 0 L 10 10"')
    })

    it('handles nested forbidden tags without leaking executable opening tags', () => {
      const clean = sanitizeGlyphSvg('<script>a<script>b</script>c</script><path d="M0 0"/>')
      // Lazy match means inner script first; outer is then a stray closer
      // (harmless — no opening tag to execute).
      expect(clean).not.toMatch(/<script\s/i)
      expect(clean).not.toMatch(/<script>/i)
    })
  })
})

describe('sanitizeWritingSystem', () => {
  it('sanitizes every glyph svg', () => {
    const ws = {
      id: 'a',
      name: 'x',
      glyphs: [
        { id: '1', name: 'a', svg: '<svg onload="x()"><path d="M0 0"/></svg>' },
        { id: '2', name: 'b', svg: '<svg><script>y()</script></svg>' },
      ],
    }
    const clean = sanitizeWritingSystem(ws)
    expect(clean.glyphs![0].svg).not.toMatch(/onload/i)
    expect(clean.glyphs![1].svg).not.toMatch(/script/i)
  })

  it('returns the original value for nullish input', () => {
    expect(sanitizeWritingSystem(null)).toBeNull()
    expect(sanitizeWritingSystem(undefined)).toBeUndefined()
  })

  it('does not mutate the input', () => {
    const ws = {
      glyphs: [{ id: '1', name: 'a', svg: '<svg onload="x"></svg>' }],
    }
    const before = JSON.stringify(ws)
    sanitizeWritingSystem(ws)
    expect(JSON.stringify(ws)).toBe(before)
  })
})

describe('sanitizeLanguageDefinition', () => {
  it('sanitizes the writingSystem field on a language definition', () => {
    const def = {
      phonology: { consonants: ['p', 't'], vowels: ['a'] },
      writingSystem: {
        glyphs: [{ id: '1', name: 'a', svg: '<svg><script>1</script></svg>' }],
      },
    }
    const clean = sanitizeLanguageDefinition(def) as typeof def
    expect(clean.writingSystem.glyphs[0].svg).not.toMatch(/script/i)
    expect(clean.phonology.consonants).toEqual(['p', 't'])
  })

  it('passes through definitions with no writingSystem', () => {
    const def = { phonology: { consonants: [], vowels: [] } }
    const clean = sanitizeLanguageDefinition(def)
    expect(clean).toEqual(def)
  })
})
