'use client'

import { LanguageDefinition } from '@/lib/generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PhonotacticsTabProps {
  definition: LanguageDefinition
  onUpdate: (updates: Partial<LanguageDefinition>) => void
}

export function PhonotacticsTab({ definition, onUpdate }: PhonotacticsTabProps) {
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
    const input = prompt('Enter syllable template (e.g., CV, CVC, V):')
    if (input && !phonotactics.syllableTemplates.includes(input)) {
      updateSyllableTemplates([...phonotactics.syllableTemplates, input])
    }
  }

  const addForbiddenSequence = () => {
    const input = prompt('Enter forbidden sequence (e.g., kk, vv):')
    if (input && !phonotactics.forbiddenSequences.includes(input)) {
      updateForbiddenSequences([...phonotactics.forbiddenSequences, input])
    }
  }

  const removeSyllableTemplate = (template: string) => {
    updateSyllableTemplates(phonotactics.syllableTemplates.filter(t => t !== template))
  }

  const removeForbiddenSequence = (sequence: string) => {
    updateForbiddenSequences(phonotactics.forbiddenSequences.filter(s => s !== sequence))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Syllable Templates</CardTitle>
          <CardDescription>
            Define valid syllable structures. Use C for consonant, V for vowel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="e.g., CV, CVC, V"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = e.currentTarget.value.trim()
                  if (value && !phonotactics.syllableTemplates.includes(value)) {
                    updateSyllableTemplates([...phonotactics.syllableTemplates, value])
                    e.currentTarget.value = ''
                  }
                }
              }}
            />
            <Button onClick={addSyllableTemplate}>Add</Button>
          </div>
          <div className="space-y-2">
            {phonotactics.syllableTemplates.map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-md"
              >
                <code className="flex-1">{t}</code>
                <button
                  onClick={() => removeSyllableTemplate(t)}
                  className="text-destructive hover:text-destructive/80"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Examples: CV (consonant-vowel), CVC, V (vowel only), CCV (consonant cluster + vowel)
          </p>
        </CardContent>
      </Card>

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
              placeholder="e.g., kk, vv"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = e.currentTarget.value.trim()
                  if (value && !phonotactics.forbiddenSequences.includes(value)) {
                    updateForbiddenSequences([...phonotactics.forbiddenSequences, value])
                    e.currentTarget.value = ''
                  }
                }
              }}
            />
            <Button onClick={addForbiddenSequence}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {phonotactics.forbiddenSequences.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-md"
              >
                <span>{s}</span>
                <button
                  onClick={() => removeForbiddenSequence(s)}
                  className="ml-1 text-destructive hover:text-destructive/80"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

