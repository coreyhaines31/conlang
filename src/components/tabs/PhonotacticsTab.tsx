'use client'

import { useState } from 'react'
import { LanguageDefinition, generateWords } from '@/lib/generator'
import { SYLLABLE_TEMPLATE_PRESETS } from '@/lib/presets'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PhonotacticsTabProps {
  definition: LanguageDefinition
  onUpdate: (updates: Partial<LanguageDefinition>) => void
}

export function PhonotacticsTab({ definition, onUpdate }: PhonotacticsTabProps) {
  const [templateInput, setTemplateInput] = useState('')
  const [sequenceInput, setSequenceInput] = useState('')
  const [previewWords, setPreviewWords] = useState<string[]>([])

  const phonotactics = definition.phonotactics || {
    syllableTemplates: [],
    forbiddenSequences: [],
  }

  const updateSyllableTemplates = (templates: string[]) => {
    onUpdate({
      phonotactics: {
        ...phonotactics,
        syllableTemplates: templates,
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
    if (value && !phonotactics.syllableTemplates.includes(value)) {
      updateSyllableTemplates([...phonotactics.syllableTemplates, value])
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
    updateSyllableTemplates(phonotactics.syllableTemplates.filter(t => t !== template))
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

  return (
    <div className="space-y-6">
      {/* Syllable Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Syllable Templates</CardTitle>
          <CardDescription>
            Define valid syllable structures. Use C for consonant, V for vowel.
            ({phonotactics.syllableTemplates.length} defined)
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
                  disabled={phonotactics.syllableTemplates.includes(preset.template)}
                  onClick={() => {
                    if (!phonotactics.syllableTemplates.includes(preset.template)) {
                      updateSyllableTemplates([...phonotactics.syllableTemplates, preset.template])
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
            {phonotactics.syllableTemplates.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                No syllable templates defined. Add some using the buttons above.
              </span>
            ) : (
              phonotactics.syllableTemplates.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-md"
                >
                  <code className="flex-1 font-mono">{t}</code>
                  <span className="text-xs text-muted-foreground">
                    {SYLLABLE_TEMPLATE_PRESETS.find(p => p.template === t)?.description || 'Custom'}
                  </span>
                  <button
                    onClick={() => removeSyllableTemplate(t)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
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
