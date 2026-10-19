import { NextRequest, NextResponse } from 'next/server'
import { generateText, RetryError } from 'ai'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { sanitizeGlyphSvg } from '@/lib/sanitize-svg'

// Any vision-capable AI Gateway model ID works. Override with GLYPH_MODEL to
// switch models without a code change; the fallbacks cover provider outages.
const DEFAULT_GLYPH_MODEL = 'anthropic/claude-haiku-5.5'
const FALLBACK_GLYPH_MODELS = ['google/gemini-2.5-flash-lite', 'openai/gpt-6-luna']

// Rate limit: 10 AI glyph generations per minute per IP
const RATE_LIMIT_CONFIG = {
  limit: 10,
  windowMs: 60 * 1000, // 1 minute
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit first
    const clientIP = getClientIP(request.headers)
    const rateLimitResult = rateLimit(`glyph:${clientIP}`, RATE_LIMIT_CONFIG)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait before generating more glyphs.',
          resetIn: rateLimitResult.resetIn 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetIn),
            'Retry-After': String(rateLimitResult.resetIn),
          }
        }
      )
    }

    const { sketchDataUrl, style, phoneme } = await request.json()

    // Style descriptions for different glyph aesthetics
    const stylePrompts: Record<string, string> = {
      runic: 'angular, carved stone runes with sharp edges, Norse/Elder Futhark inspired',
      flowing: 'elegant cursive strokes, calligraphic, flowing like Arabic or Elvish script',
      geometric: 'clean geometric shapes, circles, triangles, lines, modernist design',
      organic: 'natural flowing lines like vines or leaves, Art Nouveau inspired',
      blocky: 'thick bold strokes, chunky geometric, brutalist typography',
      minimal: 'simple single-stroke design, minimalist, essential lines only',
      ornate: 'decorative with flourishes and serifs, medieval manuscript style',
      alien: 'otherworldly, asymmetric, unusual angles, sci-fi inspired glyphs',
    }

    const styleDescription = stylePrompts[style] || stylePrompts.geometric

    // Generate a clean glyph based on the sketch
    const model = process.env.GLYPH_MODEL || DEFAULT_GLYPH_MODEL
    const { text: svgContent } = await generateText({
      model,
      providerOptions: {
        gateway: { models: FALLBACK_GLYPH_MODELS.filter((m) => m !== model) },
      },
      reasoning: 'none',
      instructions: `You are a writing system designer. When given a rough sketch of a glyph, you create a clean, stylized SVG version.

Output ONLY valid SVG code with these requirements:
- viewBox="0 0 100 100"
- Use stroke="currentColor" and fill="none" (or fill="currentColor" for solid shapes)
- stroke-width between 2-6
- Keep it simple and iconic - this is a single character/glyph
- No text elements, only paths/shapes
- Make it look intentional and designed, not random

The glyph should be ${styleDescription}.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Create a clean, stylized glyph for the sound "${phoneme}" based on this rough sketch. Output only the SVG code, nothing else.`
            },
            {
              type: 'file',
              mediaType: 'image/png',
              data: sketchDataUrl,
            }
          ]
        }
      ],
      maxOutputTokens: 1000,
    })

    // Extract just the SVG if wrapped in markdown
    let cleanSvg = svgContent
    const svgMatch = svgContent.match(/<svg[\s\S]*<\/svg>/i)
    if (svgMatch) {
      cleanSvg = svgMatch[0]
    }

    // Validate it's actually SVG
    if (!cleanSvg.includes('<svg') || !cleanSvg.includes('</svg>')) {
      return NextResponse.json(
        { error: 'AI did not return valid SVG' },
        { status: 500 }
      )
    }

    // Even though the model is told to output paths-only, sanitize before
    // we hand back something the client will eventually render with
    // dangerouslySetInnerHTML.
    const safeSvg = sanitizeGlyphSvg(cleanSvg)

    return NextResponse.json(
      { svg: safeSvg },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.resetIn),
        }
      }
    )
  } catch (error: unknown) {
    // Retryable failures arrive wrapped in a RetryError after the SDK gives up.
    const cause = RetryError.isInstance(error) ? error.lastError : error
    const { statusCode, type } = (cause ?? {}) as { statusCode?: number; type?: string }

    // AI Gateway returns 402 when credits or a budget run out, and 429 for
    // short-lived rate limits.
    if (statusCode === 402 || statusCode === 429) {
      const isQuota = statusCode === 402
      console.error(isQuota ? 'AI Gateway credits exhausted:' : 'AI Gateway rate limited:', {
        statusCode,
        type,
      })

      return NextResponse.json(
        isQuota
          ? {
              error: 'Glyph generation is temporarily unavailable. Please try again later.',
              code: 'service_unavailable',
            }
          : {
              error: 'Glyph generation is busy right now. Please try again in a minute.',
              code: 'rate_limited',
            },
        {
          status: isQuota ? 503 : 429,
          headers: { 'Retry-After': isQuota ? '3600' : '60' },
        }
      )
    }

    console.error('Glyph generation error:', {
      name: cause instanceof Error ? cause.name : typeof cause,
      statusCode,
      type,
      message: cause instanceof Error ? cause.message : 'Unknown error',
    })

    return NextResponse.json(
      { error: 'Failed to generate glyph' },
      { status: 500 }
    )
  }
}

