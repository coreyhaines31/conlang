'use client'

import { useState } from 'react'
import { Language } from '@/lib/supabase/types'
import { LanguageDefinition, generateWords } from '@/lib/generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface GeneratedWord {
  phonemic: string
  orthographic: string
  selected: boolean
}

interface OverviewTabProps {
  language: Partial<Language>
  onUpdate: (lang: Partial<Language>) => void
  onAddToLexicon?: (words: Array<{ phonemic: string; orthographic: string }>) => void
}

export function OverviewTab({ language, onUpdate, onAddToLexicon }: OverviewTabProps) {
  const [wordCount, setWordCount] = useState(20)
  const [generatedWords, setGeneratedWords] = useState<GeneratedWord[]>([])
  const [generationSeed, setGenerationSeed] = useState(0)

  const handleGenerate = () => {
    const seed = language.seed || Date.now()
    const newSeed = generationSeed + 1
    setGenerationSeed(newSeed)
    
    const words = generateWords(
      seed + newSeed,
      wordCount,
      (language.definition || {}) as LanguageDefinition
    )
    
    setGeneratedWords(words.map(w => ({ ...w, selected: false })))
  }

  const toggleWordSelection = (index: number) => {
    setGeneratedWords(prev =>
      prev.map((w, i) => (i === index ? { ...w, selected: !w.selected } : w))
    )
  }

  const selectAll = () => {
    setGeneratedWords(prev => prev.map(w => ({ ...w, selected: true })))
  }

  const selectNone = () => {
    setGeneratedWords(prev => prev.map(w => ({ ...w, selected: false })))
  }

  const handleAddToLexicon = () => {
    const selected = generatedWords.filter(w => w.selected)
    if (selected.length > 0 && onAddToLexicon) {
      onAddToLexicon(selected.map(w => ({ phonemic: w.phonemic, orthographic: w.orthographic })))
      // Remove added words from the list
      setGeneratedWords(prev => prev.filter(w => !w.selected))
    }
  }

  const selectedCount = generatedWords.filter(w => w.selected).length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core language settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Seed</Label>
            <Input
              type="number"
              value={language.seed || 0}
              onChange={(e) =>
                onUpdate({ ...language, seed: parseInt(e.target.value) || 0 })
              }
              placeholder="Random seed for generation"
            />
            <p className="text-xs text-muted-foreground">
              Same seed + definition = same generated words
            </p>
          </div>

          <div className="space-y-2">
            <Label>Generator Version</Label>
            <Input
              type="text"
              value={language.generator_version || '1.0.0'}
              onChange={(e) =>
                onUpdate({ ...language, generator_version: e.target.value })
              }
              placeholder="1.0.0"
            />
            <p className="text-xs text-muted-foreground">
              Version of the generator algorithm used
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Word Generation</CardTitle>
          <CardDescription>Generate sample words using current settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="wordCount">Generate</Label>
              <Input
                id="wordCount"
                type="number"
                min={1}
                max={100}
                value={wordCount}
                onChange={(e) => setWordCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">words</span>
            </div>
            <Button onClick={handleGenerate}>
              Generate
            </Button>
          </div>

          {generatedWords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Generated Words ({generatedWords.length})</Label>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={selectNone}>
                    Select None
                  </Button>
                  {onAddToLexicon && selectedCount > 0 && (
                    <Button size="sm" onClick={handleAddToLexicon}>
                      Add {selectedCount} to Lexicon
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                {generatedWords.map((word, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 cursor-pointer ${
                      word.selected ? 'bg-secondary' : ''
                    }`}
                    onClick={() => toggleWordSelection(i)}
                  >
                    <Checkbox
                      checked={word.selected}
                      onCheckedChange={() => toggleWordSelection(i)}
                    />
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground block">Phonemic</span>
                        <span className="font-mono">/{word.phonemic}/</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Orthographic</span>
                        <span className="font-mono">{word.orthographic}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Click words to select them, then add to your lexicon
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
