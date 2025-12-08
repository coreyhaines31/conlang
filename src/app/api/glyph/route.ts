import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

// Rate limit: 10 AI glyph generations per minute per IP
const RATE_LIMIT_CONFIG = {
  limit: 10,
  windowMs: 60 * 1000, // 1 minute
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit first
    const clientIP = getClientIP(request)
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

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
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a writing system designer. When given a rough sketch of a glyph, you create a clean, stylized SVG version.

Output ONLY valid SVG code with these requirements:
- viewBox="0 0 100 100"
- Use stroke="currentColor" and fill="none" (or fill="currentColor" for solid shapes)
- stroke-width between 2-6
- Keep it simple and iconic - this is a single character/glyph
- No text elements, only paths/shapes
- Make it look intentional and designed, not random

The glyph should be ${styleDescription}.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Create a clean, stylized glyph for the sound "${phoneme}" based on this rough sketch. Output only the SVG code, nothing else.`
            },
            {
              type: 'image_url',
              image_url: {
                url: sketchDataUrl,
                detail: 'low'
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
    })

    const svgContent = response.choices[0]?.message?.content || ''
    
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

    return NextResponse.json(
      { svg: cleanSvg },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.resetIn),
        }
      }
    )
  } catch (error: any) {
    console.error('Glyph generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate glyph' },
      { status: 500 }
    )
  }
}

