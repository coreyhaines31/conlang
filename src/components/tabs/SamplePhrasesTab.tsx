'use client'

import { useState, useMemo } from 'react'
import { LexiconEntry } from '@/lib/supabase/types'
import { LanguageDefinition, generateWords } from '@/lib/generator'
import { PHRASE_PACKS, Phrase, RenderedWord, RenderedPhrase, GRAMMATICAL_PHRASES, GrammaticalPhrase } from '@/lib/phrases'
import { transformPhrase, TransformedPhrase } from '@/lib/phraseTransformer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface SamplePhrasesTabProps {
  definition: LanguageDefinition
  lexiconEntries: LexiconEntry[]
  seed: number
  onAddToLexicon?: (entries: Array<{ gloss: string; phonemic: string; orthographic: string }>) => void
}

type RenderMode = 'simple' | 'grammatical'

export function SamplePhrasesTab({ 
  definition, 
  lexiconEntries, 
  seed,
  onAddToLexicon 
}: SamplePhrasesTabProps) {
  const [selectedPack, setSelectedPack] = useState(PHRASE_PACKS[0].id)
  const [showPhonemic, setShowPhonemic] = useState(true)
  const [showOrthographic, setShowOrthographic] = useState(true)
  const [selectedMissing, setSelectedMissing] = useState<Set<string>>(new Set())
  const [renderMode, setRenderMode] = useState<RenderMode>('simple')
  const [showAffixes, setShowAffixes] = useState(false)

  // Create a lookup map from gloss to lexicon entry
  const lexiconMap = useMemo(() => {
    const map = new Map<string, LexiconEntry>()
    for (const entry of lexiconEntries) {
      // Use lowercase gloss as key for case-insensitive matching
      map.set(entry.gloss.toLowerCase(), entry)
    }
    return map
  }, [lexiconEntries])

  // Generate placeholder words for missing glosses
  const generatePlaceholder = (gloss: string, index: number): { phonemic: string; orthographic: string } => {
    // Use a deterministic seed based on the gloss and main seed
    const glossSeed = seed + gloss.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index
    const words = generateWords(glossSeed, 1, definition)
    return words[0] || { phonemic: gloss, orthographic: gloss }
  }

  // Render a phrase with lexicon lookups and placeholders (simple mode)
  const renderPhrase = (phrase: Phrase): RenderedPhrase => {
    const words: RenderedWord[] = []
    const missingGlosses: string[] = []
    
    phrase.gloss.forEach((gloss, index) => {
      const entry = lexiconMap.get(gloss.toLowerCase())
      
      if (entry) {
        words.push({
          gloss,
          phonemic: entry.phonemic_form,
          orthographic: entry.orthographic_form,
          isGenerated: false,
        })
      } else {
        const placeholder = generatePlaceholder(gloss, index)
        words.push({
          gloss,
          phonemic: placeholder.phonemic,
          orthographic: placeholder.orthographic,
          isGenerated: true,
        })
        missingGlosses.push(gloss)
      }
    })
    
    return { phrase, words, missingGlosses }
  }

  // Render grammatical phrases with morphology and syntax
  const renderGrammaticalPhrase = (phrase: GrammaticalPhrase): TransformedPhrase => {
    return transformPhrase(
      phrase,
      definition,
      lexiconEntries,
      (gloss) => generatePlaceholder(gloss, 0)
    )
  }

  const currentPack = PHRASE_PACKS.find(p => p.id === selectedPack) || PHRASE_PACKS[0]
  
  const renderedPhrases = useMemo(() => 
    currentPack.phrases.map(renderPhrase),
    [currentPack, lexiconMap, seed, definition]
  )

  const grammaticalPhrases = useMemo(() =>
    GRAMMATICAL_PHRASES.map(renderGrammaticalPhrase),
    [definition, lexiconEntries, seed]
  )

  // Collect all unique missing glosses
  const allMissingGlosses = useMemo(() => {
    const missing = new Set<string>()
    if (renderMode === 'simple') {
      renderedPhrases.forEach(rp => {
        rp.missingGlosses.forEach(g => missing.add(g.toLowerCase()))
      })
    } else {
      grammaticalPhrases.forEach(tp => {
        tp.words.forEach(w => {
          if (!w.isFromLexicon) missing.add(w.original.toLowerCase())
        })
      })
    }
    return Array.from(missing).sort()
  }, [renderedPhrases, grammaticalPhrases, renderMode])

  const toggleMissingSelection = (gloss: string) => {
    setSelectedMissing(prev => {
      const next = new Set(prev)
      if (next.has(gloss)) {
        next.delete(gloss)
      } else {
        next.add(gloss)
      }
      return next
    })
  }

  const selectAllMissing = () => {
    setSelectedMissing(new Set(allMissingGlosses))
  }

  const selectNoneMissing = () => {
    setSelectedMissing(new Set())
  }

  const handleAddMissingToLexicon = () => {
    if (!onAddToLexicon || selectedMissing.size === 0) return
    
    const entriesToAdd = Array.from(selectedMissing).map((gloss, index) => {
      const placeholder = generatePlaceholder(gloss, index)
      return {
        gloss,
        phonemic: placeholder.phonemic,
        orthographic: placeholder.orthographic,
      }
    })
    
    onAddToLexicon(entriesToAdd)
    setSelectedMissing(new Set())
  }

  const hasMorphology = definition.morphology && 
    (definition.morphology.affixes.length > 0 || definition.morphology.syntax)

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Render Mode</CardTitle>
          <CardDescription>Choose how phrases are rendered</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={renderMode === 'simple' ? 'default' : 'outline'}
              onClick={() => setRenderMode('simple')}
            >
              Simple (Word-by-word)
            </Button>
            <Button
              variant={renderMode === 'grammatical' ? 'default' : 'outline'}
              onClick={() => setRenderMode('grammatical')}
              disabled={!hasMorphology}
              title={!hasMorphology ? 'Add affixes in the Grammar tab first' : ''}
            >
              Grammatical (With morphology)
            </Button>
          </div>
          {renderMode === 'grammatical' && !hasMorphology && (
            <p className="text-sm text-amber-600 mt-2">
              Add affixes in the Grammar tab to enable grammatical rendering.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pack Selection (only for simple mode) */}
      {renderMode === 'simple' && (
        <Card>
          <CardHeader>
            <CardTitle>Phrase Packs</CardTitle>
            <CardDescription>Choose a theme to see sample phrases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PHRASE_PACKS.map(pack => (
                <Button
                  key={pack.id}
                  variant={selectedPack === pack.id ? 'default' : 'outline'}
                  onClick={() => setSelectedPack(pack.id)}
                >
                  {pack.name}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {currentPack.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle>Display Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="showPhonemic"
                checked={showPhonemic}
                onCheckedChange={(checked) => setShowPhonemic(checked as boolean)}
              />
              <Label htmlFor="showPhonemic">Show Phonemic</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="showOrthographic"
                checked={showOrthographic}
                onCheckedChange={(checked) => setShowOrthographic(checked as boolean)}
              />
              <Label htmlFor="showOrthographic">Show Orthographic</Label>
            </div>
            {renderMode === 'grammatical' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showAffixes"
                  checked={showAffixes}
                  onCheckedChange={(checked) => setShowAffixes(checked as boolean)}
                />
                <Label htmlFor="showAffixes">Show Applied Affixes</Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rendered Phrases - Simple Mode */}
      {renderMode === 'simple' && (
        <Card>
          <CardHeader>
            <CardTitle>Phrases</CardTitle>
            <CardDescription>
              {renderedPhrases.length} phrases • 
              {allMissingGlosses.length > 0 
                ? ` ${allMissingGlosses.length} missing words (shown in italics)` 
                : ' All words found in lexicon'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {renderedPhrases.map((rp, i) => (
                <div key={rp.phrase.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="text-sm text-muted-foreground mb-1">
                    {rp.phrase.english}
                  </div>
                  <div className="space-y-1">
                    {showPhonemic && (
                      <div className="font-mono">
                        /{rp.words.map((w, j) => (
                          <span 
                            key={j} 
                            className={w.isGenerated ? 'italic text-amber-600 dark:text-amber-400' : ''}
                            title={w.isGenerated ? `Generated placeholder for "${w.gloss}"` : w.gloss}
                          >
                            {w.phonemic || '?'}
                            {j < rp.words.length - 1 ? ' ' : ''}
                          </span>
                        ))}/
                      </div>
                    )}
                    {showOrthographic && (
                      <div className="font-mono text-lg">
                        {rp.words.map((w, j) => (
                          <span 
                            key={j} 
                            className={w.isGenerated ? 'italic text-amber-600 dark:text-amber-400' : ''}
                            title={w.isGenerated ? `Generated placeholder for "${w.gloss}"` : w.gloss}
                          >
                            {w.orthographic || '?'}
                            {j < rp.words.length - 1 ? ' ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rendered Phrases - Grammatical Mode */}
      {renderMode === 'grammatical' && (
        <Card>
          <CardHeader>
            <CardTitle>Grammatical Phrases</CardTitle>
            <CardDescription>
              Phrases with morphology and syntax rules applied
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {grammaticalPhrases.map((tp, i) => (
                <div key={tp.original.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="text-sm text-muted-foreground mb-1">
                    {tp.original.english}
                  </div>
                  
                  {/* Word breakdown */}
                  {showAffixes && (
                    <div className="text-xs text-muted-foreground mb-2 flex flex-wrap gap-2">
                      {tp.words.map((w, j) => (
                        <span key={j} className="bg-secondary px-2 py-1 rounded">
                          <span className="font-medium">{w.original}</span>
                          {w.affixesApplied.length > 0 && (
                            <span className="ml-1 text-primary">
                              +{w.affixesApplied.join(', ')}
                            </span>
                          )}
                          <span className="ml-1">→ {w.transformed}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    {showPhonemic && (
                      <div className="font-mono">
                        /{tp.reordered.map((w, j) => {
                          const word = tp.words.find(tw => tw.orthographic === w)
                          const isGenerated = word ? !word.isFromLexicon : false
                          return (
                            <span 
                              key={j} 
                              className={isGenerated ? 'italic text-amber-600 dark:text-amber-400' : ''}
                            >
                              {word?.transformed || w}
                              {j < tp.reordered.length - 1 ? ' ' : ''}
                            </span>
                          )
                        })}/
                      </div>
                    )}
                    {showOrthographic && (
                      <div className="font-mono text-lg">
                        {tp.reordered.map((w, j) => {
                          const word = tp.words.find(tw => tw.orthographic === w)
                          const isGenerated = word ? !word.isFromLexicon : false
                          return (
                            <span 
                              key={j} 
                              className={isGenerated ? 'italic text-amber-600 dark:text-amber-400' : ''}
                            >
                              {w}
                              {j < tp.reordered.length - 1 ? ' ' : ''}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Words */}
      {allMissingGlosses.length > 0 && onAddToLexicon && (
        <Card>
          <CardHeader>
            <CardTitle>Missing Words</CardTitle>
            <CardDescription>
              Select words to add to your lexicon with auto-generated forms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAllMissing}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={selectNoneMissing}>
                Select None
              </Button>
              {selectedMissing.size > 0 && (
                <Button size="sm" onClick={handleAddMissingToLexicon}>
                  Add {selectedMissing.size} to Lexicon
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {allMissingGlosses.map(gloss => {
                const placeholder = generatePlaceholder(gloss, 0)
                return (
                  <div
                    key={gloss}
                    className={`flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-secondary/50 ${
                      selectedMissing.has(gloss) ? 'bg-secondary' : ''
                    }`}
                    onClick={() => toggleMissingSelection(gloss)}
                  >
                    <Checkbox
                      checked={selectedMissing.has(gloss)}
                      onCheckedChange={() => toggleMissingSelection(gloss)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{gloss}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        → {placeholder.orthographic}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
