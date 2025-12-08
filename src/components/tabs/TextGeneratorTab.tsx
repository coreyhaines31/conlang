'use client'

import { useState, useMemo } from 'react'
import { LanguageDefinition } from '@/lib/generator'
import { LexiconEntry } from '@/lib/supabase/types'
import {
  GlossWord,
  GlossClause,
  StructuredInput,
  GenerationResult,
  createEmptyGlossWord,
  createEmptyClause,
  generateFromStructured,
  parseGlossNotation,
  toGlossNotation,
} from '@/lib/textGenerator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

interface TextGeneratorTabProps {
  definition: LanguageDefinition
  lexiconEntries: LexiconEntry[]
  seed: number
  onAddToLexicon?: (entries: Array<{ gloss: string; phonemic: string; orthographic: string }>) => void
}

type InputMode = 'visual' | 'notation'

const ROLES: Array<{ value: GlossWord['role']; label: string }> = [
  { value: 'S', label: 'Subject (S)' },
  { value: 'V', label: 'Verb (V)' },
  { value: 'O', label: 'Object (O)' },
  { value: 'ADJ', label: 'Adjective' },
  { value: 'ADV', label: 'Adverb' },
  { value: 'DET', label: 'Determiner' },
  { value: 'PREP', label: 'Preposition' },
  { value: 'CONJ', label: 'Conjunction' },
  { value: 'PART', label: 'Particle' },
  { value: 'OTHER', label: 'Other' },
]

const NUMBERS = ['singular', 'plural', 'dual'] as const
const TENSES = ['past', 'present', 'future'] as const
const PERSONS = ['1st', '2nd', '3rd'] as const
const CASES = ['nominative', 'accusative', 'dative', 'genitive'] as const

export function TextGeneratorTab({
  definition,
  lexiconEntries,
  seed,
  onAddToLexicon,
}: TextGeneratorTabProps) {
  const [inputMode, setInputMode] = useState<InputMode>('visual')
  const [clauses, setClauses] = useState<GlossClause[]>([createEmptyClause()])
  const [notationInput, setNotationInput] = useState('')
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [showPhonemic, setShowPhonemic] = useState(true)
  const [showOrthographic, setShowOrthographic] = useState(true)
  const [showGloss, setShowGloss] = useState(true)
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Build lexicon lookup for autocomplete suggestions
  const lexiconGlosses = useMemo(() => 
    lexiconEntries.map(e => e.gloss.toLowerCase()),
    [lexiconEntries]
  )

  const handleAddClause = () => {
    setClauses(prev => [...prev, createEmptyClause()])
  }

  const handleRemoveClause = (clauseId: string) => {
    setClauses(prev => prev.filter(c => c.id !== clauseId))
  }

  const handleAddWord = (clauseId: string) => {
    setClauses(prev => prev.map(clause => 
      clause.id === clauseId
        ? { ...clause, words: [...clause.words, createEmptyGlossWord()] }
        : clause
    ))
  }

  const handleRemoveWord = (clauseId: string, wordId: string) => {
    setClauses(prev => prev.map(clause =>
      clause.id === clauseId
        ? { ...clause, words: clause.words.filter(w => w.id !== wordId) }
        : clause
    ))
  }

  const handleUpdateWord = (clauseId: string, wordId: string, updates: Partial<GlossWord>) => {
    setClauses(prev => prev.map(clause =>
      clause.id === clauseId
        ? {
            ...clause,
            words: clause.words.map(w =>
              w.id === wordId ? { ...w, ...updates } : w
            ),
          }
        : clause
    ))
  }

  const handleUpdateWordFeatures = (
    clauseId: string,
    wordId: string,
    featureUpdates: Partial<GlossWord['features']>
  ) => {
    setClauses(prev => prev.map(clause =>
      clause.id === clauseId
        ? {
            ...clause,
            words: clause.words.map(w =>
              w.id === wordId
                ? { ...w, features: { ...w.features, ...featureUpdates } }
                : w
            ),
          }
        : clause
    ))
  }

  const handleGenerate = () => {
    let inputClauses: GlossClause[]
    
    if (inputMode === 'notation') {
      // Parse notation input
      const lines = notationInput.trim().split('\n').filter(l => l.trim())
      inputClauses = lines.map(line => parseGlossNotation(line))
    } else {
      inputClauses = clauses.filter(c => c.words.length > 0)
    }
    
    if (inputClauses.length === 0 || inputClauses.every(c => c.words.length === 0)) {
      alert('Please add at least one word to generate.')
      return
    }
    
    const input: StructuredInput = { clauses: inputClauses }
    const generated = generateFromStructured(input, definition, lexiconEntries, seed)
    setResult(generated)
  }

  const handleSyncNotation = () => {
    // Convert visual input to notation
    const notation = clauses
      .filter(c => c.words.length > 0)
      .map(c => toGlossNotation(c))
      .join('\n')
    setNotationInput(notation)
    setInputMode('notation')
  }

  const handleSyncVisual = () => {
    // Convert notation to visual input
    const lines = notationInput.trim().split('\n').filter(l => l.trim())
    const parsed = lines.map(line => parseGlossNotation(line))
    setClauses(parsed.length > 0 ? parsed : [createEmptyClause()])
    setInputMode('visual')
  }

  const handleAddMissingToLexicon = () => {
    if (!result || !onAddToLexicon) return
    
    const missing = result.clauses.flatMap(c =>
      c.words
        .filter(w => !w.isFromLexicon)
        .map(w => ({
          gloss: w.original.gloss,
          phonemic: w.baseForm,
          orthographic: w.orthographicForm,
        }))
    )
    
    if (missing.length > 0) {
      onAddToLexicon(missing)
    }
  }

  const hasMorphology = definition.morphology && definition.morphology.affixes.length > 0

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Text Generator</CardTitle>
          <CardDescription>
            Create text by specifying glosses (meanings) and grammatical features.
            The generator will produce conlang output following your language&apos;s rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={inputMode === 'visual' ? 'default' : 'outline'}
              onClick={() => setInputMode('visual')}
            >
              Visual Builder
            </Button>
            <Button
              variant={inputMode === 'notation' ? 'default' : 'outline'}
              onClick={() => setInputMode('notation')}
            >
              Notation Mode
            </Button>
            {inputMode === 'visual' && clauses.some(c => c.words.length > 0) && (
              <Button variant="ghost" size="sm" onClick={handleSyncNotation}>
                → Convert to Notation
              </Button>
            )}
            {inputMode === 'notation' && notationInput.trim() && (
              <Button variant="ghost" size="sm" onClick={handleSyncVisual}>
                → Convert to Visual
              </Button>
            )}
          </div>

          {!hasMorphology && (
            <div className="p-3 mb-4 bg-amber-100 dark:bg-amber-900 rounded-md text-sm">
              <strong>Tip:</strong> Add affixes in the Grammar tab to enable inflection.
              Without morphology, words will appear in their base forms.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Builder */}
      {inputMode === 'visual' && (
        <Card>
          <CardHeader>
            <CardTitle>Sentence Builder</CardTitle>
            <CardDescription>
              Add words and assign grammatical roles and features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {clauses.map((clause, clauseIndex) => (
              <div key={clause.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Clause {clauseIndex + 1}
                  </Label>
                  {clauses.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveClause(clause.id)}
                      className="text-destructive"
                    >
                      Remove Clause
                    </Button>
                  )}
                </div>

                {/* Words in this clause */}
                <div className="space-y-3">
                  {clause.words.map((word, wordIndex) => (
                    <div
                      key={word.id}
                      className="grid grid-cols-12 gap-2 items-start p-3 bg-secondary/30 rounded"
                    >
                      {/* Gloss */}
                      <div className="col-span-3">
                        <Label className="text-xs">Gloss</Label>
                        <Input
                          value={word.gloss}
                          onChange={(e) => handleUpdateWord(clause.id, word.id, { gloss: e.target.value })}
                          placeholder="meaning"
                          list={`glosses-${word.id}`}
                          className="h-8"
                        />
                        <datalist id={`glosses-${word.id}`}>
                          {lexiconGlosses.slice(0, 20).map(g => (
                            <option key={g} value={g} />
                          ))}
                        </datalist>
                      </div>

                      {/* Role */}
                      <div className="col-span-2">
                        <Label className="text-xs">Role</Label>
                        <select
                          value={word.role}
                          onChange={(e) => handleUpdateWord(clause.id, word.id, { role: e.target.value as GlossWord['role'] })}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        >
                          {ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Number */}
                      <div className="col-span-2">
                        <Label className="text-xs">Number</Label>
                        <select
                          value={word.features.number || ''}
                          onChange={(e) => handleUpdateWordFeatures(clause.id, word.id, { number: e.target.value as any || undefined })}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        >
                          <option value="">-</option>
                          {NUMBERS.map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>

                      {/* Tense (for verbs) */}
                      <div className="col-span-2">
                        <Label className="text-xs">Tense</Label>
                        <select
                          value={word.features.tense || ''}
                          onChange={(e) => handleUpdateWordFeatures(clause.id, word.id, { tense: e.target.value as any || undefined })}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        >
                          <option value="">-</option>
                          {TENSES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Person */}
                      <div className="col-span-2">
                        <Label className="text-xs">Person</Label>
                        <select
                          value={word.features.person || ''}
                          onChange={(e) => handleUpdateWordFeatures(clause.id, word.id, { person: e.target.value as any || undefined })}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        >
                          <option value="">-</option>
                          {PERSONS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      {/* Remove */}
                      <div className="col-span-1 flex items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveWord(clause.id, word.id)}
                          className="h-8 text-destructive"
                        >
                          ×
                        </Button>
                      </div>

                      {/* Additional features row */}
                      <div className="col-span-12 flex flex-wrap gap-4 pt-1">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`neg-${word.id}`}
                            checked={word.features.negation || false}
                            onCheckedChange={(checked) => handleUpdateWordFeatures(clause.id, word.id, { negation: checked as boolean })}
                          />
                          <Label htmlFor={`neg-${word.id}`} className="text-xs">Negation</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`dim-${word.id}`}
                            checked={word.features.diminutive || false}
                            onCheckedChange={(checked) => handleUpdateWordFeatures(clause.id, word.id, { diminutive: checked as boolean })}
                          />
                          <Label htmlFor={`dim-${word.id}`} className="text-xs">Diminutive</Label>
                        </div>
                        <div className="flex items-center gap-1">
                          <Label className="text-xs">Case:</Label>
                          <select
                            value={word.features.case || ''}
                            onChange={(e) => handleUpdateWordFeatures(clause.id, word.id, { case: e.target.value as any || undefined })}
                            className="h-6 rounded border border-input bg-background px-1 text-xs"
                          >
                            <option value="">-</option>
                            {CASES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddWord(clause.id)}
                >
                  + Add Word
                </Button>
              </div>
            ))}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleAddClause}>
                + Add Clause
              </Button>
              <Button onClick={handleGenerate}>
                Generate Text
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notation Mode */}
      {inputMode === 'notation' && (
        <Card>
          <CardHeader>
            <CardTitle>Gloss Notation</CardTitle>
            <CardDescription>
              Enter glosses using linguistic notation. One clause per line.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-secondary/50 rounded text-sm font-mono">
              <strong>Format:</strong> ROLE:gloss[FEATURES]<br />
              <strong>Example:</strong> DET:the S:cat[SG] V:see[PAST.3RD] DET:the O:dog[PL]<br />
              <strong>Features:</strong> SG/PL/DU (number), PAST/PRES/FUT (tense), 1ST/2ND/3RD (person), NOM/ACC/DAT/GEN (case), NEG, DIM
            </div>

            <Textarea
              value={notationInput}
              onChange={(e) => setNotationInput(e.target.value)}
              placeholder="S:cat[SG] V:see[PAST.3RD] O:dog[PL]"
              rows={5}
              className="font-mono"
            />

            <Button onClick={handleGenerate}>
              Generate Text
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Output</CardTitle>
            <CardDescription>
              {result.stats.totalWords} words • {result.stats.fromLexicon} from lexicon • {result.stats.generated} generated • {result.stats.affixesApplied} affixes applied
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Display toggles */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showPhonemic"
                  checked={showPhonemic}
                  onCheckedChange={(checked) => setShowPhonemic(checked as boolean)}
                />
                <Label htmlFor="showPhonemic">Phonemic</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showOrthographic"
                  checked={showOrthographic}
                  onCheckedChange={(checked) => setShowOrthographic(checked as boolean)}
                />
                <Label htmlFor="showOrthographic">Orthographic</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showGloss"
                  checked={showGloss}
                  onCheckedChange={(checked) => setShowGloss(checked as boolean)}
                />
                <Label htmlFor="showGloss">Gloss</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showBreakdown"
                  checked={showBreakdown}
                  onCheckedChange={(checked) => setShowBreakdown(checked as boolean)}
                />
                <Label htmlFor="showBreakdown">Show Breakdown</Label>
              </div>
            </div>

            {/* Main output */}
            <div className="space-y-2 p-4 bg-secondary/30 rounded-lg">
              {showPhonemic && (
                <div className="font-mono text-lg">
                  /{result.fullPhonemic}/
                </div>
              )}
              {showOrthographic && (
                <div className="font-serif text-2xl">
                  {result.fullOrthographic}
                </div>
              )}
              {showGloss && (
                <div className="text-sm text-muted-foreground">
                  {result.fullGloss}
                </div>
              )}
            </div>

            {/* Word breakdown */}
            {showBreakdown && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-3 py-2 text-left">Gloss</th>
                      <th className="px-3 py-2 text-left">Role</th>
                      <th className="px-3 py-2 text-left">Base</th>
                      <th className="px-3 py-2 text-left">Inflected</th>
                      <th className="px-3 py-2 text-left">Affixes</th>
                      <th className="px-3 py-2 text-left">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.clauses.flatMap(clause =>
                      clause.words.map(word => (
                        <tr key={word.original.id} className="border-t">
                          <td className="px-3 py-2">{word.original.gloss}</td>
                          <td className="px-3 py-2">{word.original.role}</td>
                          <td className="px-3 py-2 font-mono">{word.baseForm}</td>
                          <td className="px-3 py-2 font-mono">{word.inflectedForm}</td>
                          <td className="px-3 py-2 text-xs">
                            {word.affixesApplied.length > 0 
                              ? word.affixesApplied.map((a, i) => (
                                  <span key={i} className="inline-block bg-primary/20 px-1 rounded mr-1">
                                    {a.split('(')[0]}
                                  </span>
                                ))
                              : '-'}
                          </td>
                          <td className="px-3 py-2">
                            {word.isFromLexicon 
                              ? <span className="text-green-600">Lexicon</span>
                              : <span className="text-amber-600">Generated</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded text-sm">
                <strong>Notes:</strong>
                <ul className="list-disc ml-4 mt-1">
                  {result.warnings.slice(0, 10).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                  {result.warnings.length > 10 && (
                    <li>...and {result.warnings.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            {/* Add missing to lexicon */}
            {result.stats.generated > 0 && onAddToLexicon && (
              <Button variant="outline" onClick={handleAddMissingToLexicon}>
                Add {result.stats.generated} Generated Words to Lexicon
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Examples</CardTitle>
          <CardDescription>
            Click to load an example sentence structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNotationInput('DET:the S:cat[SG] V:see[PRES.3RD] DET:the O:dog[SG]')
                setInputMode('notation')
              }}
            >
              &quot;The cat sees the dog&quot;
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNotationInput('S:I[1ST.SG] V:eat[PAST] O:food[SG]')
                setInputMode('notation')
              }}
            >
              &quot;I ate food&quot;
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNotationInput('DET:the ADJ:big S:warrior[PL] V:fight[FUT.3RD]')
                setInputMode('notation')
              }}
            >
              &quot;The big warriors will fight&quot;
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNotationInput('S:you[2ND.SG] V:speak[PRES.2ND] PREP:to DET:the O:king[SG.DAT]')
                setInputMode('notation')
              }}
            >
              &quot;You speak to the king&quot;
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

