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
  locked: boolean    // Locked words persist across regeneration
  favorite: boolean  // Favorite words are highlighted
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
    
    // Keep locked words
    const lockedWords = generatedWords.filter(w => w.locked)
    const newWordsNeeded = wordCount - lockedWords.length
    
    if (newWordsNeeded > 0) {
      const words = generateWords(
        seed + newSeed,
        newWordsNeeded,
        (language.definition || {}) as LanguageDefinition
      )
      
      const newWords = words.map(w => ({ 
        ...w, 
        selected: false, 
        locked: false, 
        favorite: false 
      }))
      
      // Combine locked words with new words
      setGeneratedWords([...lockedWords, ...newWords])
    } else {
      // If we have more locked words than requested, just keep the locked ones
      setGeneratedWords(lockedWords.slice(0, wordCount))
    }
  }

  const toggleWordSelection = (index: number) => {
    setGeneratedWords(prev =>
      prev.map((w, i) => (i === index ? { ...w, selected: !w.selected } : w))
    )
  }

  const toggleWordLock = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setGeneratedWords(prev =>
      prev.map((w, i) => (i === index ? { ...w, locked: !w.locked } : w))
    )
  }

  const toggleWordFavorite = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setGeneratedWords(prev =>
      prev.map((w, i) => (i === index ? { ...w, favorite: !w.favorite } : w))
    )
  }

  const selectAll = () => {
    setGeneratedWords(prev => prev.map(w => ({ ...w, selected: true })))
  }

  const selectNone = () => {
    setGeneratedWords(prev => prev.map(w => ({ ...w, selected: false })))
  }

  const selectFavorites = () => {
    setGeneratedWords(prev => prev.map(w => ({ ...w, selected: w.favorite })))
  }

  const clearUnlocked = () => {
    setGeneratedWords(prev => prev.filter(w => w.locked))
  }

  const handleAddToLexicon = () => {
    const selected = generatedWords.filter(w => w.selected)
    if (selected.length > 0 && onAddToLexicon) {
      onAddToLexicon(selected.map(w => ({ phonemic: w.phonemic, orthographic: w.orthographic })))
      // Remove added words from the list (unless locked)
      setGeneratedWords(prev => prev.filter(w => !w.selected || w.locked).map(w => ({ ...w, selected: false })))
    }
  }

  const selectedCount = generatedWords.filter(w => w.selected).length
  const lockedCount = generatedWords.filter(w => w.locked).length
  const favoriteCount = generatedWords.filter(w => w.favorite).length

  const randomizeSeed = () => {
    onUpdate({ ...language, seed: Math.floor(Math.random() * 2147483647) })
  }

  return (
    <div className="space-y-6">
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
            {lockedCount > 0 && (
              <span className="text-xs text-muted-foreground">
                ({lockedCount} locked)
              </span>
            )}
          </div>

          {generatedWords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label>Generated Words ({generatedWords.length})</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={selectNone}>
                    Select None
                  </Button>
                  {favoriteCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={selectFavorites}>
                      Select ★ ({favoriteCount})
                    </Button>
                  )}
                  {lockedCount > 0 && generatedWords.length > lockedCount && (
                    <Button variant="ghost" size="sm" onClick={clearUnlocked}>
                      Clear Unlocked
                    </Button>
                  )}
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
                    } ${word.favorite ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => toggleWordFavorite(i, e)}
                        className={`p-1 rounded hover:bg-secondary ${
                          word.favorite ? 'text-amber-500' : 'text-muted-foreground'
                        }`}
                        title={word.favorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {word.favorite ? '★' : '☆'}
                      </button>
                      <button
                        onClick={(e) => toggleWordLock(i, e)}
                        className={`p-1 rounded hover:bg-secondary ${
                          word.locked ? 'text-blue-500' : 'text-muted-foreground'
                        }`}
                        title={word.locked ? 'Unlock (will be replaced on regenerate)' : 'Lock (keep on regenerate)'}
                      >
                        {word.locked ? '🔒' : '🔓'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Click words to select, then add to lexicon</p>
                <p>• ★ Favorite words for easy selection later</p>
                <p>• 🔒 Lock words to keep them when regenerating</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Settings - Collapsed by default */}
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          <span className="group-open:rotate-90 transition-transform">▶</span>
          Advanced Settings
        </summary>
        <Card className="mt-3">
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generation Seed</Label>
                <Button variant="outline" size="sm" onClick={randomizeSeed}>
                  🎲 Randomize
                </Button>
              </div>
              <Input
                type="number"
                value={language.seed || 0}
                onChange={(e) =>
                  onUpdate({ ...language, seed: parseInt(e.target.value) || 0 })
                }
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Controls randomization. Same seed = same generated words. Share this number to let others reproduce your results.
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
                disabled
                className="font-mono text-sm bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Algorithm version (for compatibility). Don't change this.
              </p>
            </div>
          </CardContent>
        </Card>
      </details>
    </div>
  )
}
