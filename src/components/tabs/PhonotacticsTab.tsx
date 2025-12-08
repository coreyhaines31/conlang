'use client'

import { useState } from 'react'
import { LanguageDefinition, SyllableTemplate, generateWords } from '@/lib/generator'
import { SYLLABLE_TEMPLATE_PRESETS } from '@/lib/presets'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PhonotacticsTabProps {
  definition: LanguageDefinition
  onUpdate: (updates: Partial<LanguageDefinition>) => void
}

// Normalize templates to weighted format
function normalizeTemplates(templates: string[] | SyllableTemplate[] | undefined): SyllableTemplate[] {
  if (!templates || templates.length === 0) return []
  
  if (typeof templates[0] === 'object' && 'template' in templates[0]) {
    return templates as SyllableTemplate[]
  }
  
  return (templates as string[]).map(template => ({ template, weight: 1 }))
}

export function PhonotacticsTab({ definition, onUpdate }: PhonotacticsTabProps) {
  const [templateInput, setTemplateInput] = useState('')
  const [sequenceInput, setSequenceInput] = useState('')
  const [previewWords, setPreviewWords] = useState<string[]>([])

  const phonotactics = definition.phonotactics || {
    syllableTemplates: [],
    forbiddenSequences: [],
  }

  const templates = normalizeTemplates(phonotactics.syllableTemplates)

  const updateSyllableTemplates = (newTemplates: SyllableTemplate[]) => {
    onUpdate({
      phonotactics: {
        ...phonotactics,
        syllableTemplates: newTemplates,
      },
    })
  }

  const updateForbiddenSequences = (sequences: string[]) => {
    onUpdate({
      phonotactics: {
        ...phonotactics,
        forbiddenSequences: sequences,
      },
    })
  }

  const addSyllableTemplate = () => {
    const value = templateInput.trim().toUpperCase()
    if (value && !templates.some(t => t.template === value)) {
      updateSyllableTemplates([...templates, { template: value, weight: 1 }])
      setTemplateInput('')
    }
  }

  const addForbiddenSequence = () => {
    const value = sequenceInput.trim()
    if (value && !phonotactics.forbiddenSequences.includes(value)) {
      updateForbiddenSequences([...phonotactics.forbiddenSequences, value])
      setSequenceInput('')
    }
  }

  const removeSyllableTemplate = (template: string) => {
    updateSyllableTemplates(templates.filter(t => t.template !== template))
  }

  const updateTemplateWeight = (template: string, weight: number) => {
    updateSyllableTemplates(
      templates.map(t => t.template === template ? { ...t, weight: Math.max(0, weight) } : t)
    )
  }

  const removeForbiddenSequence = (sequence: string) => {
    updateForbiddenSequences(phonotactics.forbiddenSequences.filter(s => s !== sequence))
  }

  const handleTestGenerate = () => {
    try {
      const words = generateWords(Date.now(), 10, definition)
      setPreviewWords(words.map(w => w.orthographic))
    } catch (e) {
      console.error('Generation failed:', e)
      setPreviewWords(['(generation failed - check your settings)'])
    }
  }

  // Calculate total weight for percentage display
  const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0)

  return (
    <div className="space-y-6">
      {/* Syllable Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Syllable Templates</CardTitle>
          <CardDescription>
            Define valid syllable structures with weights. Higher weight = more common.
            ({templates.length} defined)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick add presets */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Quick add:</Label>
            <div className="flex flex-wrap gap-1">
              {SYLLABLE_TEMPLATE_PRESETS.map((preset) => (
                <Button
                  key={preset.template}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={templates.some(t => t.template === preset.template)}
                  onClick={() => {
                    if (!templates.some(t => t.template === preset.template)) {
                      updateSyllableTemplates([...templates, { template: preset.template, weight: 1 }])
                    }
                  }}
                  title={preset.description}
                >
                  {preset.template}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Custom template (e.g., CVVC)"
              value={templateInput}
              onChange={(e) => setTemplateInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSyllableTemplate()
                }
              }}
            />
            <Button onClick={addSyllableTemplate}>Add</Button>
          </div>

          <div className="space-y-2">
            {templates.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                No syllable templates defined. Add some using the buttons above.
              </span>
            ) : (
              templates.map((t, i) => {
                const percentage = totalWeight > 0 ? Math.round((t.weight / totalWeight) * 100) : 0
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 bg-secondary rounded-md"
                  >
                    <code className="font-mono min-w-16">{t.template}</code>
                    <div className="flex items-center gap-2 flex-1">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Weight:</Label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={t.weight}
                        onChange={(e) => updateTemplateWeight(t.template, parseInt(e.target.value) || 0)}
                        className="w-16 h-7 text-sm"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        ({percentage}%)
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground hidden md:block">
                      {SYLLABLE_TEMPLATE_PRESETS.find(p => p.template === t.template)?.description || 'Custom'}
                    </span>
                    <button
                      onClick={() => removeSyllableTemplate(t.template)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      ×
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {templates.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Tip: Set higher weights for common syllable types (e.g., CV=3, CVC=2, V=1)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Forbidden Sequences */}
      <Card>
        <CardHeader>
          <CardTitle>Forbidden Sequences</CardTitle>
          <CardDescription>
            Sequences that should not appear in generated words
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="e.g., kk, vv, aa"
              value={sequenceInput}
              onChange={(e) => setSequenceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addForbiddenSequence()
                }
              }}
            />
            <Button onClick={addForbiddenSequence}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {phonotactics.forbiddenSequences.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                No forbidden sequences. Words may contain any phoneme combinations.
              </span>
            ) : (
              phonotactics.forbiddenSequences.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-md"
                >
                  <span className="font-mono">{s}</span>
                  <button
                    onClick={() => removeForbiddenSequence(s)}
                    className="ml-1 text-destructive hover:text-destructive/80"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Generate Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Test Generate</CardTitle>
          <CardDescription>
            Preview how words look with current phonology and phonotactics settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTestGenerate} variant="outline">
            Generate 10 Sample Words
          </Button>
          {previewWords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previewWords.map((word, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md font-mono"
                >
                  {word}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
