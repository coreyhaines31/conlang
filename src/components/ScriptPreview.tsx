'use client'

import { useMemo } from 'react'
import { WritingSystem, renderTextAsGlyphs } from '@/lib/script'

interface ScriptPreviewProps {
  text: string
  writingSystem: WritingSystem
  className?: string
}

export function ScriptPreview({ text, writingSystem, className = '' }: ScriptPreviewProps) {
  const renderedGlyphs = useMemo(() => {
    return renderTextAsGlyphs(text, writingSystem)
  }, [text, writingSystem])

  if (!writingSystem || writingSystem.glyphs.length === 0) {
    return null
  }

  return (
    <div
      className={`flex flex-wrap items-center ${className}`}
      style={{
        gap: writingSystem.spacing,
        flexDirection: writingSystem.direction === 'rtl' ? 'row-reverse' : 'row',
      }}
    >
      {renderedGlyphs.map((item, i) => {
        if (!item.glyphId) {
          return (
            <span
              key={i}
              className="font-mono"
              style={{ fontSize: writingSystem.defaultGlyphSize * 0.8 }}
            >
              {item.char === ' ' ? '\u00A0' : item.char}
            </span>
          )
        }
        
        const glyph = writingSystem.glyphs.find(g => g.id === item.glyphId)
        if (!glyph) return null
        
        return (
          <div
            key={i}
            style={{
              width: writingSystem.defaultGlyphSize,
              height: writingSystem.defaultGlyphSize,
            }}
            dangerouslySetInnerHTML={{ __html: glyph.svg }}
            title={item.char}
          />
        )
      })}
    </div>
  )
}

