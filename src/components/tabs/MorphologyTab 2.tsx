'use client'

import { useState } from 'react'
import { LanguageDefinition } from '@/lib/generator'
import {
  MorphologyConfig,
  Affix,
  AffixType,
  GrammaticalCategory,
  SyntaxConfig,
  WordOrder,
  AdjectivePosition,
  AdpositionType,
  createEmptyMorphologyConfig,
  applyAffix,
  AFFIX_PRESETS,
  COMPOUND_PRESETS,
  DEFAULT_SYNTAX,
} from '@/lib/morphology'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface MorphologyTabProps {
  definition: LanguageDefinition
  onUpdate: (updates: Partial<LanguageDefinition>) => void
}

const AFFIX_TYPES: AffixType[] = ['prefix', 'suffix', 'infix', 'circumfix']
const CATEGORIES: GrammaticalCategory[] = [
  'number', 'tense', 'aspect', 'mood', 'person', 'case', 
  'gender', 'possession', 'definiteness', 'degree', 'voice', 
  'negation', 'diminutive', 'augmentative'
]

export function MorphologyTab({ definition, onUpdate }: MorphologyTabProps) {
  const [newAffixForm, setNewAffixForm] = useState('')
  const [newAffixType, setNewAffixType] = useState<AffixType>('suffix')
  const [newAffixCategory, setNewAffixCategory] = useState<GrammaticalCategory>('number')
  const [newAffixValue, setNewAffixValue] = useState('')
  const [testWord, setTestWord] = useState('word')

  const morphology = definition.morphology || createEmptyMorphologyConfig()
  const syntax = morphology.syntax || DEFAULT_SYNTAX

  const updateMorphology = (updates: Partial<MorphologyConfig>) => {
    onUpdate({
      morphology: { ...morphology, ...updates },
    })
  }

  const updateSyntax = (updates: Partial<SyntaxConfig>) => {
    updateMorphology({
      syntax: { ...syntax, ...updates },
    })
  }

  const addAffix = () => {
    if (!newAffixForm || !newAffixValue) return
    
    const newAffix: Affix = {
      id: `affix-${Date.now()}`,
      type: newAffixType,
      form: newAffixForm,
      category: newAffixCategory,
      value: newAffixValue,
      priority: morphology.affixes.length + 1,
    }
    
    updateMorphology({
      affixes: [...morphology.affixes, newAffix],
    })
    
    setNewAffixForm('')
    setNewAffixValue('')
  }

  const removeAffix = (affixId: string) => {
    updateMorphology({
      affixes: morphology.affixes.filter(a => a.id !== affixId),
    })
  }

  const addPreset = (presetKey: string) => {
    const presetAffixes = AFFIX_PRESETS[presetKey]
    if (!presetAffixes) return
    
    // Add affixes that don't already exist
    const existingIds = new Set(morphology.affixes.map(a => a.id))
    const newAffixes = presetAffixes.filter(a => !existingIds.has(a.id))
    
    if (newAffixes.length > 0) {
      updateMorphology({
        affixes: [...morphology.affixes, ...newAffixes],
      })
    }
  }

  // Group affixes by category for display
  const affixesByCategory = morphology.affixes.reduce((acc, affix) => {
    if (!acc[affix.category]) {
      acc[affix.category] = []
    }
    acc[affix.category].push(affix)
    return acc
  }, {} as Record<GrammaticalCategory, Affix[]>)

  return (
    <div className="space-y-6">
      {/* Syntax Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Syntax</CardTitle>
          <CardDescription>
            Configure basic word order and grammatical structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Word Order</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={syntax.wordOrder}
                onChange={(e) => updateSyntax({ wordOrder: e.target.value as WordOrder })}
              >
                <option value="SVO">SVO (Subject-Verb-Object)</option>
                <option value="SOV">SOV (Subject-Object-Verb)</option>
                <option value="VSO">VSO (Verb-Subject-Object)</option>
                <option value="VOS">VOS (Verb-Object-Subject)</option>
                <option value="OSV">OSV (Object-Subject-Verb)</option>
                <option value="OVS">OVS (Object-Verb-Subject)</option>
                <option value="free">Free word order</option>
              </select>
            </div>

            <div>
              <Label>Adjective Position</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={syntax.adjectivePosition}
                onChange={(e) => updateSyntax({ adjectivePosition: e.target.value as AdjectivePosition })}
              >
                <option value="before">Before noun (big house)</option>
                <option value="after">After noun (house big)</option>
              </select>
            </div>

            <div>
              <Label>Adpositions</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={syntax.adpositionType}
                onChange={(e) => updateSyntax({ adpositionType: e.target.value as AdpositionType })}
              >
                <option value="preposition">Prepositions (to the house)</option>
                <option value="postposition">Postpositions (house the to)</option>
                <option value="circumposition">Circumpositions</option>
              </select>
            </div>

            <div>
              <Label>Plural Marking</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={syntax.pluralMarking}
                onChange={(e) => updateSyntax({ pluralMarking: e.target.value as any })}
              >
                <option value="suffix">Suffix (-s, -en)</option>
                <option value="prefix">Prefix</option>
                <option value="reduplication">Reduplication</option>
                <option value="none">No marking</option>
              </select>
            </div>

            <div>
              <Label>Tense Marking</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={syntax.tenseMarking}
                onChange={(e) => updateSyntax({ tenseMarking: e.target.value as any })}
              >
                <option value="suffix">Suffix (-ed)</option>
                <option value="prefix">Prefix</option>
                <option value="particle">Separate particle</option>
                <option value="none">No marking</option>
              </select>
            </div>

            <div>
              <Label>Question Formation</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={syntax.questionFormation}
                onChange={(e) => updateSyntax({ questionFormation: e.target.value as any })}
              >
                <option value="particle">Question particle</option>
                <option value="inversion">Word order change</option>
                <option value="intonation">Intonation only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasArticles"
                checked={syntax.hasArticles}
                onCheckedChange={(checked) => updateSyntax({ hasArticles: checked as boolean })}
              />
              <Label htmlFor="hasArticles">Has articles (a/the)</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affix Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Affix Presets</CardTitle>
          <CardDescription>
            Quick-add common affix patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.keys(AFFIX_PRESETS).map(key => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => addPreset(key)}
              >
                + {key.replace(/-/g, ' ')}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Affix Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Affixes</CardTitle>
          <CardDescription>
            Define prefixes, suffixes, and other morphemes ({morphology.affixes.length} defined)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new affix */}
          <div className="border-b pb-4">
            <Label className="text-sm mb-2 block">Add New Affix</Label>
            <div className="grid grid-cols-5 gap-2">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newAffixType}
                onChange={(e) => setNewAffixType(e.target.value as AffixType)}
              >
                {AFFIX_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Input
                placeholder="Form (e.g., -s)"
                value={newAffixForm}
                onChange={(e) => setNewAffixForm(e.target.value)}
                className="font-mono"
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newAffixCategory}
                onChange={(e) => setNewAffixCategory(e.target.value as GrammaticalCategory)}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Input
                placeholder="Value (e.g., plural)"
                value={newAffixValue}
                onChange={(e) => setNewAffixValue(e.target.value)}
              />
              <Button onClick={addAffix} disabled={!newAffixForm || !newAffixValue}>
                Add
              </Button>
            </div>
          </div>

          {/* Affix list by category */}
          {Object.keys(affixesByCategory).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No affixes defined. Add some manually or use the presets above.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(affixesByCategory).map(([category, affixes]) => (
                <div key={category}>
                  <Label className="text-sm capitalize">{category}</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {affixes.map(affix => (
                      <div
                        key={affix.id}
                        className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-md"
                      >
                        <span className="text-xs text-muted-foreground">{affix.type}:</span>
                        <span className="font-mono">{affix.form}</span>
                        <span className="text-xs">= {affix.value}</span>
                        <button
                          onClick={() => removeAffix(affix.id)}
                          className="ml-1 text-destructive hover:text-destructive/80"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Affixes */}
      <Card>
        <CardHeader>
          <CardTitle>Test Affixes</CardTitle>
          <CardDescription>
            See how affixes apply to a test word
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Test word:</Label>
            <Input
              value={testWord}
              onChange={(e) => setTestWord(e.target.value)}
              className="w-32 font-mono"
            />
          </div>

          {morphology.affixes.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {morphology.affixes.map(affix => (
                <div
                  key={affix.id}
                  className="p-2 border rounded bg-secondary/30"
                >
                  <div className="text-xs text-muted-foreground">
                    {affix.category}: {affix.value}
                  </div>
                  <div className="font-mono">
                    {testWord} → {applyAffix(testWord, affix)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example Sentences */}
      <Card>
        <CardHeader>
          <CardTitle>Word Order Preview</CardTitle>
          <CardDescription>
            See how your syntax settings affect sentence structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono">
            <div className="p-2 bg-secondary rounded">
              <span className="text-xs text-muted-foreground block">Basic sentence:</span>
              {syntax.wordOrder === 'SVO' && 'The cat sees the dog'}
              {syntax.wordOrder === 'SOV' && 'The cat the dog sees'}
              {syntax.wordOrder === 'VSO' && 'Sees the cat the dog'}
              {syntax.wordOrder === 'VOS' && 'Sees the dog the cat'}
              {syntax.wordOrder === 'OSV' && 'The dog the cat sees'}
              {syntax.wordOrder === 'OVS' && 'The dog sees the cat'}
              {syntax.wordOrder === 'free' && 'The cat sees the dog (flexible)'}
            </div>
            <div className="p-2 bg-secondary rounded">
              <span className="text-xs text-muted-foreground block">Adjective + noun:</span>
              {syntax.adjectivePosition === 'before' 
                ? 'big house' 
                : 'house big'}
            </div>
            <div className="p-2 bg-secondary rounded">
              <span className="text-xs text-muted-foreground block">Adposition:</span>
              {syntax.adpositionType === 'preposition' && 'to the house'}
              {syntax.adpositionType === 'postposition' && 'the house to'}
              {syntax.adpositionType === 'circumposition' && 'to the house -ward'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

