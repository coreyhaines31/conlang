'use client'

import { LanguageDefinition } from '@/lib/generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PhonologyTabProps {
  definition: LanguageDefinition
  onUpdate: (updates: Partial<LanguageDefinition>) => void
}

export function PhonologyTab({ definition, onUpdate }: PhonologyTabProps) {
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
    const input = prompt('Enter consonant (e.g., p, t, k):')
    if (input && !phonology.consonants.includes(input)) {
      updateConsonants([...phonology.consonants, input])
    }
  }

  const addVowel = () => {
    const input = prompt('Enter vowel (e.g., a, e, i):')
    if (input && !phonology.vowels.includes(input)) {
      updateVowels([...phonology.vowels, input])
    }
  }

  const removeConsonant = (consonant: string) => {
    updateConsonants(phonology.consonants.filter(c => c !== consonant))
  }

  const removeVowel = (vowel: string) => {
    updateVowels(phonology.vowels.filter(v => v !== vowel))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Consonants</CardTitle>
          <CardDescription>Available consonant phonemes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add consonant"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = e.currentTarget.value.trim()
                  if (value && !phonology.consonants.includes(value)) {
                    updateConsonants([...phonology.consonants, value])
                    e.currentTarget.value = ''
                  }
                }
              }}
            />
            <Button onClick={addConsonant}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {phonology.consonants.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-md"
              >
                <span>{c}</span>
                <button
                  onClick={() => removeConsonant(c)}
                  className="ml-1 text-destructive hover:text-destructive/80"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vowels</CardTitle>
          <CardDescription>Available vowel phonemes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add vowel"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = e.currentTarget.value.trim()
                  if (value && !phonology.vowels.includes(value)) {
                    updateVowels([...phonology.vowels, value])
                    e.currentTarget.value = ''
                  }
                }
              }}
            />
            <Button onClick={addVowel}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {phonology.vowels.map((v, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-md"
              >
                <span>{v}</span>
                <button
                  onClick={() => removeVowel(v)}
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

