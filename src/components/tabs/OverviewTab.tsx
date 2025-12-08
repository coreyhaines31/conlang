'use client'

import { useState } from 'react'
import { Language } from '@/lib/supabase/types'
import { LanguageDefinition, generateWords } from '@/lib/generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Shuffle, 
  Star, 
  Lock, 
  Unlock,
  Volume2,
  BookOpen,
  PenTool,
  GitBranch,
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  Settings2,
} from 'lucide-react'
import { PHONOLOGY_PRESETS } from '@/lib/presets'

interface GeneratedWord {
  phonemic: string
  orthographic: string
  selected: boolean
  locked: boolean
  favorite: boolean
}

interface OverviewTabProps {
  language: Partial<Language>
  onUpdate: (lang: Partial<Language>) => void
  onAddToLexicon?: (words: Array<{ phonemic: string; orthographic: string }>) => void
  onNavigate?: (tab: string) => void
}

type ApproachType = 'quick' | 'custom' | null

export function OverviewTab({ language, onUpdate, onAddToLexicon, onNavigate }: OverviewTabProps) {
  const [wordCount, setWordCount] = useState(20)
  const [generatedWords, setGeneratedWords] = useState<GeneratedWord[]>([])
  const [generationSeed, setGenerationSeed] = useState(0)
  const [selectedApproach, setSelectedApproach] = useState<ApproachType>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const definition = (language.definition || {}) as LanguageDefinition
  const hasPhonology = definition.phonology?.consonants?.length > 0 || definition.phonology?.vowels?.length > 0
  const hasName = !!language.name

  const handleApplyPreset = (presetId: string) => {
    const preset = PHONOLOGY_PRESETS.find(p => p.id === presetId)
    if (preset) {
      setSelectedPreset(presetId)
      onUpdate({
        ...language,
        definition: {
          ...definition,
          phonology: {
            consonants: preset.phonology.consonants,
            vowels: preset.phonology.vowels,
          },
          phonotactics: {
            syllableTemplates: preset.phonotactics.syllableTemplates.map(t => 
              typeof t === 'string' ? t : t.template
            ),
            forbiddenSequences: preset.phonotactics.forbiddenSequences,
          },
        },
      })
    }
  }

  const randomizeSeed = () => {
    onUpdate({ ...language, seed: Math.floor(Math.random() * 2147483647) })
  }

  const handleGenerate = () => {
    const seed = language.seed || Date.now()
    const newSeed = generationSeed + 1
    setGenerationSeed(newSeed)
    
    const lockedWords = generatedWords.filter(w => w.locked)
    const newWordsNeeded = wordCount - lockedWords.length
    
    if (newWordsNeeded > 0) {
      const words = generateWords(
        seed + newSeed,
        newWordsNeeded,
        definition
      )
      
      const newWords = words.map(w => ({ 
        ...w, 
        selected: false, 
        locked: false, 
        favorite: false 
      }))
      
      setGeneratedWords([...lockedWords, ...newWords])
    } else {
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

  const handleAddToLexicon = () => {
    const selected = generatedWords.filter(w => w.selected)
    if (selected.length > 0 && onAddToLexicon) {
      onAddToLexicon(selected.map(w => ({ phonemic: w.phonemic, orthographic: w.orthographic })))
      setGeneratedWords(prev => prev.filter(w => !w.selected || w.locked).map(w => ({ ...w, selected: false })))
    }
  }

  const selectedCount = generatedWords.filter(w => w.selected).length
  const favoriteCount = generatedWords.filter(w => w.favorite).length

  // If language has phonology defined, show the word generation interface
  // (name is optional - user can add it later)
  if (hasPhonology) {
    return (
      <div className="space-y-6">
        {/* Name input if not set */}
        {!hasName && (
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-4">
              <Label className="text-amber-800 dark:text-amber-200">Name your language (optional)</Label>
              <Input
                type="text"
                value={language.name || ''}
                onChange={(e) => onUpdate({ ...language, name: e.target.value })}
                placeholder="e.g., Elvish, Klingon, Dothraki..."
                className="mt-2"
              />
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{definition.phonology?.consonants?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Consonants</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{definition.phonology?.vowels?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Vowels</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{definition.phonotactics?.syllableTemplates?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Syllable Types</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{generatedWords.length}</div>
              <div className="text-sm text-muted-foreground">Words Generated</div>
            </CardContent>
          </Card>
        </div>

        {/* Word Generation */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Words</CardTitle>
            <CardDescription>Create words using your language's sound system</CardDescription>
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
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </Button>
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
                        Select <Star className="h-3 w-3 mx-1 fill-current" /> ({favoriteCount})
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
                          <span className="text-xs text-muted-foreground block">Written</span>
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
                          <Star className={`h-4 w-4 ${word.favorite ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => toggleWordLock(i, e)}
                          className={`p-1 rounded hover:bg-secondary ${
                            word.locked ? 'text-blue-500' : 'text-muted-foreground'
                          }`}
                          title={word.locked ? 'Unlock' : 'Lock (keep on regenerate)'}
                        >
                          {word.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Continue Building</CardTitle>
            <CardDescription>Explore more features to flesh out your language</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3"
                onClick={() => onNavigate?.('phonology')}
              >
                <div className="flex items-center gap-3">
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <div className="font-medium">Sound System</div>
                    <div className="text-xs text-muted-foreground">Refine phonology and phonotactics</div>
                  </div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3"
                onClick={() => onNavigate?.('lexicon')}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <div className="font-medium">Vocabulary</div>
                    <div className="text-xs text-muted-foreground">Build your lexicon</div>
                  </div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3"
                onClick={() => onNavigate?.('script')}
              >
                <div className="flex items-center gap-3">
                  <PenTool className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <div className="font-medium">Writing System</div>
                    <div className="text-xs text-muted-foreground">Create custom glyphs</div>
                  </div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3"
                onClick={() => onNavigate?.('grammar')}
              >
                <div className="flex items-center gap-3">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <div className="font-medium">Grammar</div>
                    <div className="text-xs text-muted-foreground">Define morphology and syntax</div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
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
                    <Shuffle className="h-4 w-4 mr-1" /> Randomize
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
                  Same seed = same generated words. Share this to let others reproduce your results.
                </p>
              </div>
            </CardContent>
          </Card>
        </details>
      </div>
    )
  }

  // Onboarding flow for new languages
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Welcome Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Create Your Language</h1>
        <p className="text-muted-foreground text-lg">
          Build a constructed language from the ground up. Define sounds, create words, and bring your language to life.
        </p>
      </div>

      {/* Step 1: Name Your Language */}
      <Card className={hasName ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {hasName ? (
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                1
              </div>
            )}
            <div>
              <CardTitle>Name Your Language</CardTitle>
              <CardDescription>What will your language be called?</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            value={language.name || ''}
            onChange={(e) => onUpdate({ ...language, name: e.target.value })}
            placeholder="e.g., Eldarin, Klingon, Dothraki..."
            className="text-lg"
          />
        </CardContent>
      </Card>

      {/* Step 2: Choose Your Approach */}
      {(hasName || !hasPhonology) && (
        <Card className={hasPhonology ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {hasPhonology ? (
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  2
                </div>
              )}
              <div>
                <CardTitle>Choose Your Approach</CardTitle>
                <CardDescription>How detailed do you want to get?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Quick Start */}
              <button
                onClick={() => setSelectedApproach('quick')}
                className={`p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
                  selectedApproach === 'quick' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="font-semibold">Quick Start</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose a preset sound system and start generating words immediately. Perfect for beginners or quick projects.
                </p>
              </button>

              {/* Custom */}
              <button
                onClick={() => setSelectedApproach('custom')}
                className={`p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
                  selectedApproach === 'custom' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Settings2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="font-semibold">Full Control</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Define every consonant, vowel, and syllable pattern yourself. For linguists and detailed worldbuilders.
                </p>
              </button>
            </div>

            {/* Quick Start Presets */}
            {selectedApproach === 'quick' && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Choose a sound style:</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {PHONOLOGY_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset.id)}
                      className={`p-3 rounded-lg border text-left transition-all hover:border-primary/50 ${
                        selectedPreset === preset.id ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom - Go to Sound System */}
            {selectedApproach === 'custom' && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  Head to the Sound System section to define your consonants and vowels.
                </p>
                <Button variant="outline" onClick={() => onNavigate?.('phonology')}>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Go to Sound System
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* What You Can Build */}
      <Card>
        <CardHeader>
          <CardTitle>What You Can Build</CardTitle>
          <CardDescription>Explore all the features available to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                <Volume2 className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <div className="font-medium">Sound System</div>
                <div className="text-sm text-muted-foreground">
                  Define consonants, vowels, syllable structures, and phonological rules.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="font-medium">Vocabulary</div>
                <div className="text-sm text-muted-foreground">
                  Generate words, build a lexicon, create names for people and places.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                <PenTool className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="font-medium">Writing System</div>
                <div className="text-sm text-muted-foreground">
                  Design custom glyphs, draw your own script, or use AI to refine sketches.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                <GitBranch className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <div className="font-medium">Grammar</div>
                <div className="text-sm text-muted-foreground">
                  Add prefixes, suffixes, define word order, and create grammatical rules.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
