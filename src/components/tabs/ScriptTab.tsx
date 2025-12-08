'use client'

import { useState, useMemo } from 'react'
import { LanguageDefinition } from '@/lib/generator'
import {
  WritingSystem,
  Glyph,
  GlyphMapping,
  createEmptyWritingSystem,
  generatePlaceholderGlyphs,
  createDefaultMappings,
  renderTextAsGlyphs,
  exportWritingSystem,
  importWritingSystem,
} from '@/lib/script'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { GlyphCanvas } from '@/components/GlyphCanvas'

interface ScriptTabProps {
  definition: LanguageDefinition
  onUpdate: (updates: Partial<LanguageDefinition>) => void
}

export function ScriptTab({ definition, onUpdate }: ScriptTabProps) {
  const [previewText, setPreviewText] = useState('hello world')
  const [newGlyphName, setNewGlyphName] = useState('')
  const [newGlyphSvg, setNewGlyphSvg] = useState('')
  const [selectedGlyph, setSelectedGlyph] = useState<string | null>(null)
  const [showDrawingMode, setShowDrawingMode] = useState(false)
  const [drawingPhoneme, setDrawingPhoneme] = useState('')

  const writingSystem = definition.writingSystem || createEmptyWritingSystem()
  const phonology = definition.phonology || { consonants: [], vowels: [] }
  const allPhonemes = [...phonology.consonants, ...phonology.vowels]

  const updateWritingSystem = (updates: Partial<WritingSystem>) => {
    onUpdate({
      writingSystem: { ...writingSystem, ...updates },
    })
  }

  const handleGeneratePlaceholders = () => {
    const glyphs = generatePlaceholderGlyphs(allPhonemes)
    const mappings = createDefaultMappings(glyphs, allPhonemes)
    updateWritingSystem({ glyphs, mappings })
  }

  const handleAddGlyph = () => {
    if (!newGlyphName) return
    
    const newGlyph: Glyph = {
      id: `glyph-${Date.now()}`,
      name: newGlyphName,
      svg: newGlyphSvg || `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <text x="50" y="70" text-anchor="middle" font-size="60" fill="currentColor">${newGlyphName.charAt(0).toUpperCase()}</text>
      </svg>`,
      width: 100,
      height: 100,
    }
    
    updateWritingSystem({
      glyphs: [...writingSystem.glyphs, newGlyph],
    })
    
    setNewGlyphName('')
    setNewGlyphSvg('')
  }

  const handleDrawnGlyph = (svg: string) => {
    const phoneme = drawingPhoneme || `glyph-${Date.now()}`
    
    const newGlyph: Glyph = {
      id: `glyph-${Date.now()}`,
      name: phoneme,
      svg,
      width: 100,
      height: 100,
    }
    
    // Add glyph and create mapping
    const newMapping: GlyphMapping = {
      glyph: newGlyph.id,
      phoneme,
      grapheme: phoneme,
    }
    
    updateWritingSystem({
      glyphs: [...writingSystem.glyphs, newGlyph],
      mappings: [...writingSystem.mappings.filter(m => m.phoneme !== phoneme), newMapping],
    })
    
    setDrawingPhoneme('')
  }

  const handleRemoveGlyph = (glyphId: string) => {
    updateWritingSystem({
      glyphs: writingSystem.glyphs.filter(g => g.id !== glyphId),
      mappings: writingSystem.mappings.filter(m => m.glyph !== glyphId),
    })
  }

  const handleUpdateMapping = (glyphId: string, phoneme: string) => {
    const existingMapping = writingSystem.mappings.find(m => m.glyph === glyphId)
    
    if (existingMapping) {
      updateWritingSystem({
        mappings: writingSystem.mappings.map(m =>
          m.glyph === glyphId ? { ...m, phoneme, grapheme: phoneme } : m
        ),
      })
    } else {
      updateWritingSystem({
        mappings: [...writingSystem.mappings, { glyph: glyphId, phoneme, grapheme: phoneme }],
      })
    }
  }

  const handleExport = () => {
    const json = exportWritingSystem(writingSystem)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${writingSystem.name || 'script'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        const text = await file.text()
        const imported = importWritingSystem(text)
        if (imported) {
          updateWritingSystem(imported)
        } else {
          alert('Invalid script file')
        }
      } catch {
        alert('Failed to import script')
      }
    }
    input.click()
  }

  // Render preview
  const renderedPreview = useMemo(() => {
    return renderTextAsGlyphs(previewText, writingSystem)
  }, [previewText, writingSystem])

  return (
    <div className="space-y-6">
      {/* Draw Glyphs - Primary Action */}
      <Card>
        <CardHeader>
          <CardTitle>✏️ Draw Glyphs</CardTitle>
          <CardDescription>
            Sketch a glyph and let AI clean it up, or use procedural stylization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Phoneme selector */}
            <div className="space-y-3">
              <Label>Select phoneme to create glyph for:</Label>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border rounded">
                {allPhonemes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add consonants and vowels in the Phonology tab first
                  </p>
                ) : (
                  allPhonemes.map(phoneme => {
                    const hasGlyph = writingSystem.mappings.some(m => m.phoneme === phoneme)
                    return (
                      <Button
                        key={phoneme}
                        variant={drawingPhoneme === phoneme ? 'default' : hasGlyph ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setDrawingPhoneme(phoneme)}
                        className={hasGlyph ? 'opacity-60' : ''}
                      >
                        {phoneme} {hasGlyph && '✓'}
                      </Button>
                    )
                  })
                )}
              </div>
              {drawingPhoneme && (
                <p className="text-sm font-medium">
                  Drawing glyph for: <span className="font-mono text-lg">{drawingPhoneme}</span>
                </p>
              )}
            </div>
            
            {/* Drawing canvas */}
            <div>
              <GlyphCanvas 
                onSave={handleDrawnGlyph} 
                phoneme={drawingPhoneme}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Script Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Writing System Settings</CardTitle>
          <CardDescription>
            Configure your script&apos;s properties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Script Name</Label>
              <Input
                value={writingSystem.name}
                onChange={(e) => updateWritingSystem({ name: e.target.value })}
                placeholder="e.g., Elvish Script"
              />
            </div>
            <div>
              <Label>Direction</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={writingSystem.direction}
                onChange={(e) => updateWritingSystem({ direction: e.target.value as any })}
              >
                <option value="ltr">Left to Right</option>
                <option value="rtl">Right to Left</option>
                <option value="ttb">Top to Bottom</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Glyph Size</Label>
              <Input
                type="number"
                min={16}
                max={128}
                value={writingSystem.defaultGlyphSize}
                onChange={(e) => updateWritingSystem({ defaultGlyphSize: parseInt(e.target.value) || 32 })}
              />
            </div>
            <div>
              <Label>Spacing</Label>
              <Input
                type="number"
                min={0}
                max={32}
                value={writingSystem.spacing}
                onChange={(e) => updateWritingSystem({ spacing: parseInt(e.target.value) || 4 })}
              />
            </div>
            <div>
              <Label>Line Height</Label>
              <Input
                type="number"
                min={1}
                max={3}
                step={0.1}
                value={writingSystem.lineHeight}
                onChange={(e) => updateWritingSystem({ lineHeight: parseFloat(e.target.value) || 1.5 })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGeneratePlaceholders} variant="outline">
              Generate Placeholder Glyphs
            </Button>
            <Button onClick={handleImport} variant="outline">
              Import Script
            </Button>
            <Button onClick={handleExport} variant="outline" disabled={writingSystem.glyphs.length === 0}>
              Export Script
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Glyph Library */}
      <Card>
        <CardHeader>
          <CardTitle>Glyph Library</CardTitle>
          <CardDescription>
            {writingSystem.glyphs.length} glyphs defined
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new glyph manually */}
          <details className="border-b pb-4">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Advanced: Add glyph with SVG code
            </summary>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Input
                placeholder="Glyph name (e.g., a)"
                value={newGlyphName}
                onChange={(e) => setNewGlyphName(e.target.value)}
              />
              <Input
                placeholder="SVG content (optional)"
                value={newGlyphSvg}
                onChange={(e) => setNewGlyphSvg(e.target.value)}
              />
              <Button onClick={handleAddGlyph} disabled={!newGlyphName}>
                Add Glyph
              </Button>
            </div>
          </details>

          {/* Glyph grid */}
          {writingSystem.glyphs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No glyphs yet. Add glyphs manually or generate placeholder glyphs from your phoneme inventory.
            </p>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {writingSystem.glyphs.map((glyph) => {
                const mapping = writingSystem.mappings.find(m => m.glyph === glyph.id)
                return (
                  <div
                    key={glyph.id}
                    className={`relative group p-2 border rounded cursor-pointer hover:bg-secondary/50 ${
                      selectedGlyph === glyph.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedGlyph(selectedGlyph === glyph.id ? null : glyph.id)}
                  >
                    <div
                      className="w-12 h-12 mx-auto"
                      dangerouslySetInnerHTML={{ __html: glyph.svg }}
                    />
                    <div className="text-center text-xs mt-1 font-mono">
                      {glyph.name}
                    </div>
                    {mapping && (
                      <div className="text-center text-xs text-muted-foreground">
                        → {mapping.phoneme}
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveGlyph(glyph.id)
                      }}
                      className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 text-xs"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Mapping editor for selected glyph */}
          {selectedGlyph && (
            <div className="border-t pt-4">
              <Label className="text-sm mb-2 block">
                Map "{writingSystem.glyphs.find(g => g.id === selectedGlyph)?.name}" to phoneme:
              </Label>
              <div className="flex flex-wrap gap-1">
                {allPhonemes.map(phoneme => {
                  const currentMapping = writingSystem.mappings.find(m => m.glyph === selectedGlyph)
                  const isSelected = currentMapping?.phoneme === phoneme
                  return (
                    <Button
                      key={phoneme}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleUpdateMapping(selectedGlyph, phoneme)}
                    >
                      {phoneme}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Script Preview</CardTitle>
          <CardDescription>
            See how text renders in your script
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Preview Text</Label>
            <Input
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Enter text to preview"
            />
          </div>

          <div className="border rounded-lg p-4 min-h-24 bg-secondary/20">
            <div
              className="flex flex-wrap items-center"
              style={{
                gap: writingSystem.spacing,
                flexDirection: writingSystem.direction === 'rtl' ? 'row-reverse' : 'row',
              }}
            >
              {renderedPreview.map((item, i) => {
                if (!item.glyphId) {
                  // Render spaces and unmapped characters as text
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
          </div>

          <p className="text-xs text-muted-foreground">
            Unmapped characters are shown in regular text
          </p>
        </CardContent>
      </Card>

      {/* SVG Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Custom Glyphs</CardTitle>
          <CardDescription>
            Upload SVG files for custom glyph designs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>SVG Code</Label>
            <Textarea
              placeholder="Paste SVG code here..."
              value={newGlyphSvg}
              onChange={(e) => setNewGlyphSvg(e.target.value)}
              className="font-mono text-sm"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use viewBox="0 0 100 100" for best results. Use "currentColor" for fill/stroke to match theme.
            </p>
          </div>
          
          {newGlyphSvg && (
            <div className="border rounded p-4">
              <Label className="text-sm mb-2 block">Preview:</Label>
              <div
                className="w-16 h-16 border rounded bg-background"
                dangerouslySetInnerHTML={{ __html: newGlyphSvg }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

