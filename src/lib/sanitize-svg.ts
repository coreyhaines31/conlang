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

// HTML parses both ASCII whitespace AND `/` as the separator between a tag
// name and its first attribute, and between attributes. Anchoring stripper
// patterns only on `\s` lets `<img/onerror=alert(1)>` slip through, which
// the HTML parser then normalizes into a real onerror= attribute. We use
// `[/\s]` everywhere we need to detect "start of an attribute slot".
const ATTR_SEP = '[/\\s]'

const FORBIDDEN_TAGS = [
  // Script-execution vectors
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
  // HTML elements that can fire events / leak data when injected into a
  // dangerouslySetInnerHTML context, even though they are not valid SVG
  // children. The HTML parser is tolerant and will instantiate them.
  'img',
  'body',
  'html',
  'head',
  'video',
  'audio',
  'source',
  'track',
  'picture',
  'details',
  'summary',
  'marquee',
  'template',
  'slot',
  'frame',
  'frameset',
  // SVG elements that can fetch external resources or include arbitrary XML
  'use', // can reference external resources / cross-origin includes
  'image', // SVG image — can fetch arbitrary URLs (SSRF-ish)
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

// Strip on*= event handlers anywhere they appear in attribute position.
const EVENT_HANDLER_PATTERN = new RegExp(
  `${ATTR_SEP}on[a-z]+\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+)`,
  'gi'
)

// Strip style attributes (defense in depth — CSS in SVG can carry url() pointers).
const STYLE_ATTR_PATTERN = new RegExp(
  `${ATTR_SEP}style\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+)`,
  'gi'
)

// Strip any href / xlink:href whose value contains a script-y URL scheme.
const DANGEROUS_HREF_PATTERN = new RegExp(
  `${ATTR_SEP}(?:xlink:)?href\\s*=\\s*("(?:\\s*(?:javascript|vbscript|data|file)\\s*:[^"]*)"|'(?:\\s*(?:javascript|vbscript|data|file)\\s*:[^']*)')`,
  'gi'
)

// Second-pass fallback: strip any leftover on*= even when not preceded by an
// attribute separator (e.g. an unusual tag normalization the first pass
// missed). It is OK to be over-aggressive here because legitimate SVG glyph
// markup never contains "on*=" as text content.
const EVENT_HANDLER_FALLBACK_PATTERN = /on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi

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

  // Final safety net: catch any remaining on*= attribute that escaped the
  // separator-anchored pass.
  svg = svg.replace(EVENT_HANDLER_FALLBACK_PATTERN, '')

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
