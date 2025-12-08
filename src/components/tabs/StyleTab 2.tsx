'use client'

import { useState } from 'react'
import { LanguageDefinition, GenerationStyle, PhonologicalRule, generateWords } from '@/lib/generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface StyleTabProps {
  definition: LanguageDefinition
  onUpdate: (updates: Partial<LanguageDefinition>) => void
  seed: number
}

const DEFAULT_RULES: PhonologicalRule[] = [
  {
    id: 'voicing-assimilation',
    name: 'Voicing Assimilation',
    description: 'Voiceless consonants become voiced before voiced consonants',
    find: 'p',
    replace: 'b',
    context: { after: ['b', 'd', 'g', 'v', 'z'] },
    enabled: false,
  },
  {
    id: 'final-devoicing',
    name: 'Final Devoicing',
    description: 'Voiced stops become voiceless at word end',
    find: 'b',
    replace: 'p',
    context: { position: 'final' },
    enabled: false,
  },
  {
    id: 'vowel-harmony-back',
    name: 'Back Vowel Harmony',
    description: 'Front vowels become back vowels after back vowels',
    find: 'e',
    replace: 'o',
    context: { before: ['a', 'o', 'u'] },
    enabled: false,
  },
]

export function StyleTab({ definition, onUpdate, seed }: StyleTabProps) {
  const [previewWords, setPreviewWords] = useState<string[]>([])
  const [newRuleFind, setNewRuleFind] = useState('')
  const [newRuleReplace, setNewRuleReplace] = useState('')
  const [newRuleName, setNewRuleName] = useState('')

  const style = definition.generationStyle || {}
  const rules = definition.phonologicalRules || []
  const phonology = definition.phonology || { consonants: [], vowels: [] }

  const updateStyle = (updates: Partial<GenerationStyle>) => {
    onUpdate({
      generationStyle: { ...style, ...updates },
    })
  }

  const updateRules = (newRules: PhonologicalRule[]) => {
    onUpdate({
      phonologicalRules: newRules,
    })
  }

  const togglePreferred = (type: 'consonant' | 'vowel', phoneme: string) => {
    const key = type === 'consonant' ? 'preferredConsonants' : 'preferredVowels'
    const current = style[key] || []
    const updated = current.includes(phoneme)
      ? current.filter(p => p !== phoneme)
      : [...current, phoneme]
    updateStyle({ [key]: updated })
  }

  const toggleAvoided = (type: 'consonant' | 'vowel', phoneme: string) => {
    const key = type === 'consonant' ? 'avoidedConsonants' : 'avoidedVowels'
    const current = style[key] || []
    const updated = current.includes(phoneme)
      ? current.filter(p => p !== phoneme)
      : [...current, phoneme]
    updateStyle({ [key]: updated })
  }

  const addRule = () => {
    if (!newRuleFind || !newRuleName) return
    const newRule: PhonologicalRule = {
      id: `custom-${Date.now()}`,
      name: newRuleName,
      find: newRuleFind,
      replace: newRuleReplace,
      enabled: true,
    }
    updateRules([...rules, newRule])
    setNewRuleFind('')
    setNewRuleReplace('')
    setNewRuleName('')
  }

  const toggleRule = (ruleId: string) => {
    updateRules(
      rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r)
    )
  }

  const removeRule = (ruleId: string) => {
    updateRules(rules.filter(r => r.id !== ruleId))
  }

  const addPresetRule = (preset: PhonologicalRule) => {
    if (rules.some(r => r.id === preset.id)) return
    updateRules([...rules, { ...preset, enabled: true }])
  }

  const handleTestGenerate = () => {
    try {
      const words = generateWords(Date.now(), 10, definition)
      setPreviewWords(words.map(w => w.orthographic))
    } catch (e) {
      console.error('Generation failed:', e)
      setPreviewWords(['(generation failed)'])
    }
  }

  const syllableDist = style.syllableLengthDistribution || { 1: 1, 2: 2, 3: 1, 4: 0 }

  return (
    <div className="space-y-6">
      {/* Phoneme Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Phoneme Preferences</CardTitle>
          <CardDescription>
            Click to mark phonemes as preferred (green) or avoided (red)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm mb-2 block">Consonants</Label>
            <div className="flex flex-wrap gap-1">
              {phonology.consonants.map((c) => {
                const isPreferred = style.preferredConsonants?.includes(c)
                const isAvoided = style.avoidedConsonants?.includes(c)
                return (
                  <div key={c} className="flex flex-col items-center">
                    <button
                      onClick={() => {
                        if (isAvoided) {
                          toggleAvoided('consonant', c)
                        }
                        togglePreferred('consonant', c)
                      }}
                      className={`px-2 py-1 rounded-t font-mono text-sm border-b-0 ${
                        isPreferred 
                          ? 'bg-green-500 text-white' 
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      +
                    </button>
                    <span className="px-3 py-1 bg-secondary font-mono">{c}</span>
                    <button
                      onClick={() => {
                        if (isPreferred) {
                          togglePreferred('consonant', c)
                        }
                        toggleAvoided('consonant', c)
                      }}
                      className={`px-2 py-1 rounded-b font-mono text-sm border-t-0 ${
                        isAvoided 
                          ? 'bg-red-500 text-white' 
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      −
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <Label className="text-sm mb-2 block">Vowels</Label>
            <div className="flex flex-wrap gap-1">
              {phonology.vowels.map((v) => {
                const isPreferred = style.preferredVowels?.includes(v)
                const isAvoided = style.avoidedVowels?.includes(v)
                return (
                  <div key={v} className="flex flex-col items-center">
                    <button
                      onClick={() => {
                        if (isAvoided) {
                          toggleAvoided('vowel', v)
                        }
                        togglePreferred('vowel', v)
                      }}
                      className={`px-2 py-1 rounded-t font-mono text-sm border-b-0 ${
                        isPreferred 
                          ? 'bg-green-500 text-white' 
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      +
                    </button>
                    <span className="px-3 py-1 bg-secondary font-mono">{v}</span>
                    <button
                      onClick={() => {
                        if (isPreferred) {
                          togglePreferred('vowel', v)
                        }
                        toggleAvoided('vowel', v)
                      }}
                      className={`px-2 py-1 rounded-b font-mono text-sm border-t-0 ${
                        isAvoided 
                          ? 'bg-red-500 text-white' 
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      −
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Syllable Length Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Word Length</CardTitle>
          <CardDescription>
            Control how many syllables words typically have
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="text-center">
                <Label className="text-sm block mb-1">{n} syllable{n > 1 ? 's' : ''}</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={syllableDist[n as 1|2|3|4] || 0}
                  onChange={(e) => updateStyle({
                    syllableLengthDistribution: {
                      ...syllableDist,
                      [n]: parseInt(e.target.value) || 0
                    }
                  })}
                  className="text-center"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Higher numbers = more words of that length
          </p>
        </CardContent>
      </Card>

      {/* Common Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Common Patterns</CardTitle>
          <CardDescription>
            Common word beginnings and endings (comma-separated)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Common Beginnings</Label>
            <Input
              placeholder="e.g., st, kr, br"
              value={(style.commonBeginnings || []).join(', ')}
              onChange={(e) => updateStyle({
                commonBeginnings: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
            />
          </div>
          <div>
            <Label className="text-sm">Common Endings</Label>
            <Input
              placeholder="e.g., en, ar, ion"
              value={(style.commonEndings || []).join(', ')}
              onChange={(e) => updateStyle({
                commonEndings: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Phonological Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Phonological Rules</CardTitle>
          <CardDescription>
            Sound changes that apply after word generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset rules */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Quick add presets:</Label>
            <div className="flex flex-wrap gap-1">
              {DEFAULT_RULES.map(preset => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={rules.some(r => r.id === preset.id)}
                  onClick={() => addPresetRule(preset)}
                  title={preset.description}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Active rules */}
          {rules.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Active Rules</Label>
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center gap-2 p-2 bg-secondary rounded">
                  <Checkbox
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{rule.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {rule.find} → {rule.replace || '∅'}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(rule.id)}
                    className="text-destructive h-6 px-2"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add custom rule */}
          <div className="border-t pt-4">
            <Label className="text-sm mb-2 block">Add Custom Rule</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Rule name"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
              />
              <Input
                placeholder="Find (e.g., k)"
                value={newRuleFind}
                onChange={(e) => setNewRuleFind(e.target.value)}
                className="font-mono"
              />
              <Input
                placeholder="Replace (e.g., g)"
                value={newRuleReplace}
                onChange={(e) => setNewRuleReplace(e.target.value)}
                className="font-mono"
              />
            </div>
            <Button 
              onClick={addRule} 
              disabled={!newRuleName || !newRuleFind}
              className="mt-2"
              size="sm"
            >
              Add Rule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview with Style</CardTitle>
          <CardDescription>
            Test generation with all style settings applied
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

