// Conservative SVG sanitizer for user-supplied glyph artwork.
//
// Why this exists: the editor lets users paste arbitrary SVG, which is then
// rendered with dangerouslySetInnerHTML on the public language page. Without
// sanitization, an attacker could embed <script>, event handlers, or
// <foreignObject> payloads and execute JavaScript in any visitor's browser.
//
// Strategy: strip every construct that can cause script execution while
// preserving the limited vocabulary the editor actually generates
// (path, circle, rect, polygon, line, ellipse, polyline, g, text, svg).
// All call sites must use this function before passing untrusted SVG to
// dangerouslySetInnerHTML or before persisting it to the database.

const FORBIDDEN_TAGS = [
  'script',
  'foreignObject',
  'iframe',
  'embed',
  'object',
  'form',
  'input',
  'button',
  'a',
  'animate',
  'animateMotion',
  'animateTransform',
  'set',
  'style',
  'link',
  'meta',
  'use', // can reference external resources / cross-origin includes
  'image', // can fetch arbitrary URLs (SSRF-ish)
  'video',
  'audio',
  'source',
]

const FORBIDDEN_TAG_PATTERNS = FORBIDDEN_TAGS.map(
  (tag) => new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}\\s*>|<${tag}\\b[^>]*/?>`, 'gi')
)

const PROLOGUE_PATTERNS = [
  /<!DOCTYPE[\s\S]*?>/gi,
  /<\?xml[\s\S]*?\?>/gi,
  /<!ENTITY[\s\S]*?>/gi,
  /<!\[CDATA\[[\s\S]*?\]\]>/gi,
  /<!--[\s\S]*?-->/g,
]

// Strip on*= event handlers in any attribute position.
const EVENT_HANDLER_PATTERN = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi

// Strip style attributes (defense in depth — CSS in SVG can carry url() pointers).
const STYLE_ATTR_PATTERN = /\sstyle\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi

// Strip any href / xlink:href whose value contains a script-y URL scheme.
const DANGEROUS_HREF_PATTERN =
  /\s(?:xlink:)?href\s*=\s*("(?:\s*(?:javascript|vbscript|data|file)\s*:[^"]*)"|'(?:\s*(?:javascript|vbscript|data|file)\s*:[^']*)')/gi

export function sanitizeGlyphSvg(input: unknown): string {
  if (typeof input !== 'string') return ''
  let svg = input

  for (const pattern of PROLOGUE_PATTERNS) svg = svg.replace(pattern, '')
  for (const pattern of FORBIDDEN_TAG_PATTERNS) svg = svg.replace(pattern, '')

  svg = svg.replace(EVENT_HANDLER_PATTERN, '')
  svg = svg.replace(STYLE_ATTR_PATTERN, '')
  svg = svg.replace(DANGEROUS_HREF_PATTERN, '')

  // Strip any leftover script-y URL even outside href= contexts (e.g. in
  // attribute values we did not enumerate).
  svg = svg.replace(/\b(?:javascript|vbscript)\s*:/gi, 'about:blank#')

  return svg.trim()
}

// Sanitize a writing system definition in place: every glyph SVG is replaced
// with its sanitized form. Returns a deep-cloned object so callers can safely
// pass it to a JSONB column without sharing references with the input.
export function sanitizeWritingSystem<T extends { glyphs?: Array<{ svg?: unknown }> } | null | undefined>(
  ws: T
): T {
  if (!ws || typeof ws !== 'object') return ws
  const cloned = JSON.parse(JSON.stringify(ws)) as { glyphs?: Array<{ svg?: unknown }> }
  if (Array.isArray(cloned.glyphs)) {
    for (const glyph of cloned.glyphs) {
      if (glyph && typeof glyph === 'object') {
        glyph.svg = sanitizeGlyphSvg(glyph.svg)
      }
    }
  }
  return cloned as T
}

// Sanitize the writingSystem field of an arbitrary language definition.
export function sanitizeLanguageDefinition(def: unknown): unknown {
  if (!def || typeof def !== 'object') return def
  const cloned = JSON.parse(JSON.stringify(def)) as Record<string, unknown>
  if (cloned.writingSystem) {
    cloned.writingSystem = sanitizeWritingSystem(
      cloned.writingSystem as { glyphs?: Array<{ svg?: unknown }> }
    )
  }
  return cloned
}
