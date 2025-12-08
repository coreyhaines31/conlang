'use client'

import { useState } from 'react'
import { LanguageDefinition } from '@/lib/generator'
import { PHONOLOGY_PRESETS } from '@/lib/presets'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PhonologyTabProps {
  definition: LanguageDefinition
  onUpdate: (updates: Partial<LanguageDefinition>) => void
}

export function PhonologyTab({ definition, onUpdate }: PhonologyTabProps) {
  const [consonantInput, setConsonantInput] = useState('')
  const [vowelInput, setVowelInput] = useState('')

  const phonology = definition.phonology || {
    consonants: [],
    vowels: [],
  }

  const updateConsonants = (consonants: string[]) => {
    onUpdate({
      phonology: {
        ...phonology,
        consonants,
      },
    })
  }

  const updateVowels = (vowels: string[]) => {
    onUpdate({
      phonology: {
        ...phonology,
        vowels,
      },
    })
  }

  const addConsonant = () => {
    const value = consonantInput.trim()
    if (value && !phonology.consonants.includes(value)) {
      updateConsonants([...phonology.consonants, value])
      setConsonantInput('')
    }
  }

  const addVowel = () => {
    const value = vowelInput.trim()
    if (value && !phonology.vowels.includes(value)) {
      updateVowels([...phonology.vowels, value])
      setVowelInput('')
    }
  }

  const removeConsonant = (consonant: string) => {
    updateConsonants(phonology.consonants.filter(c => c !== consonant))
  }

  const removeVowel = (vowel: string) => {
    updateVowels(phonology.vowels.filter(v => v !== vowel))
  }

  const applyPreset = (preset: typeof PHONOLOGY_PRESETS[0]) => {
    onUpdate({
      phonology: preset.phonology,
      phonotactics: preset.phonotactics,
    })
  }

  return (
    <div className="space-y-6">
      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Presets</CardTitle>
          <CardDescription>Apply a preset to quickly configure your language's sound system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PHONOLOGY_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                className="h-auto py-2 flex flex-col items-start text-left"
                onClick={() => applyPreset(preset)}
              >
                <span className="font-medium">{preset.name}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {preset.description}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Consonants */}
      <Card>
        <CardHeader>
          <CardTitle>Consonants</CardTitle>
          <CardDescription>
            Available consonant phonemes ({phonology.consonants.length} defined)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add consonant (e.g., p, th, ng)"
              value={consonantInput}
              onChange={(e) => setConsonantInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addConsonant()
                }
              }}
            />
            <Button onClick={addConsonant}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {phonology.consonants.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                No consonants defined. Add some or apply a preset above.
              </span>
            ) : (
              phonology.consonants.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-md"
                >
                  <span className="font-mono">{c}</span>
                  <button
                    onClick={() => removeConsonant(c)}
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

      {/* Vowels */}
      <Card>
        <CardHeader>
          <CardTitle>Vowels</CardTitle>
          <CardDescription>
            Available vowel phonemes ({phonology.vowels.length} defined)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add vowel (e.g., a, ai, ou)"
              value={vowelInput}
              onChange={(e) => setVowelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addVowel()
                }
              }}
            />
            <Button onClick={addVowel}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {phonology.vowels.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                No vowels defined. Add some or apply a preset above.
              </span>
            ) : (
              phonology.vowels.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-md"
                >
                  <span className="font-mono">{v}</span>
                  <button
                    onClick={() => removeVowel(v)}
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
    </div>
  )
}
