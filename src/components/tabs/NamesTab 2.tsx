'use client'

import { useState } from 'react'
import { LanguageDefinition, NameGeneratorConfig, generateNames } from '@/lib/generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface NamesTabProps {
  definition: LanguageDefinition
  onUpdate: (updates: Partial<LanguageDefinition>) => void
  seed: number
  onAddToLexicon?: (entries: Array<{ gloss: string; phonemic: string; orthographic: string }>) => void
}

interface GeneratedName {
  phonemic: string
  orthographic: string
  selected: boolean
}

const DEFAULT_TITLE_PREFIXES = ['Lord', 'Lady', 'King', 'Queen', 'Chief', 'Elder']
const DEFAULT_DESCRIPTORS = ['the Great', 'the Wise', 'of the North', 'of the Mountains', 'Clan', 'Order']

export function NamesTab({ definition, onUpdate, seed, onAddToLexicon }: NamesTabProps) {
  const [personNames, setPersonNames] = useState<GeneratedName[]>([])
  const [placeNames, setPlaceNames] = useState<GeneratedName[]>([])
  const [factionNames, setFactionNames] = useState<GeneratedName[]>([])
  const [generationCount, setGenerationCount] = useState(10)

  const nameGenerators = definition.nameGenerators || []

  const getConfig = (type: 'person' | 'place' | 'faction'): NameGeneratorConfig | undefined => {
    return nameGenerators.find(ng => ng.type === type)
  }

  const updateConfig = (type: 'person' | 'place' | 'faction', updates: Partial<NameGeneratorConfig>) => {
    const existing = nameGenerators.find(ng => ng.type === type)
    if (existing) {
      onUpdate({
        nameGenerators: nameGenerators.map(ng =>
          ng.type === type ? { ...ng, ...updates } : ng
        ),
      })
    } else {
      onUpdate({
        nameGenerators: [...nameGenerators, { type, ...updates }],
      })
    }
  }

  const handleGeneratePersonNames = () => {
    const names = generateNames(Date.now(), generationCount, 'person', definition)
    setPersonNames(names.map(n => ({ ...n, selected: false })))
  }

  const handleGeneratePlaceNames = () => {
    const names = generateNames(Date.now(), generationCount, 'place', definition)
    setPlaceNames(names.map(n => ({ ...n, selected: false })))
  }

  const handleGenerateFactionNames = () => {
    const names = generateNames(Date.now(), generationCount, 'faction', definition)
    setFactionNames(names.map(n => ({ ...n, selected: false })))
  }

  const toggleSelection = (
    type: 'person' | 'place' | 'faction',
    index: number
  ) => {
    const setter = type === 'person' ? setPersonNames : type === 'place' ? setPlaceNames : setFactionNames
    setter(prev => prev.map((n, i) => i === index ? { ...n, selected: !n.selected } : n))
  }

  const handleAddToLexicon = (type: 'person' | 'place' | 'faction') => {
    if (!onAddToLexicon) return
    const names = type === 'person' ? personNames : type === 'place' ? placeNames : factionNames
    const selected = names.filter(n => n.selected)
    if (selected.length === 0) return

    const entries = selected.map(n => ({
      gloss: n.orthographic,
      phonemic: n.phonemic,
      orthographic: n.orthographic,
    }))

    onAddToLexicon(entries)

    // Remove added names
    const setter = type === 'person' ? setPersonNames : type === 'place' ? setPlaceNames : setFactionNames
    setter(prev => prev.filter(n => !n.selected))
  }

  const personConfig = getConfig('person')
  const factionConfig = getConfig('faction')

  return (
    <div className="space-y-6">
      {/* Generation Count */}
      <Card>
        <CardHeader>
          <CardTitle>Name Generation</CardTitle>
          <CardDescription>
            Generate names for characters, places, and factions in your language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Label>Generate</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={generationCount}
              onChange={(e) => setGenerationCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">names at a time</span>
          </div>
        </CardContent>
      </Card>

      {/* Person Names */}
      <Card>
        <CardHeader>
          <CardTitle>Person Names</CardTitle>
          <CardDescription>
            Generate names for characters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Title Prefixes (comma-separated)</Label>
            <Input
              placeholder="e.g., Lord, Lady, King"
              value={(personConfig?.titlePrefix || []).join(', ')}
              onChange={(e) => updateConfig('person', {
                titlePrefix: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {DEFAULT_TITLE_PREFIXES.map(title => (
                <Button
                  key={title}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    const current = personConfig?.titlePrefix || []
                    if (!current.includes(title)) {
                      updateConfig('person', { titlePrefix: [...current, title] })
                    }
                  }}
                >
                  + {title}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleGeneratePersonNames}>
            Generate Person Names
          </Button>

          {personNames.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Names</Label>
                {onAddToLexicon && personNames.some(n => n.selected) && (
                  <Button size="sm" onClick={() => handleAddToLexicon('person')}>
                    Add {personNames.filter(n => n.selected).length} to Lexicon
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {personNames.map((name, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-secondary/50 ${
                      name.selected ? 'bg-secondary' : ''
                    }`}
                    onClick={() => toggleSelection('person', i)}
                  >
                    <Checkbox checked={name.selected} />
                    <span className="font-medium truncate">{name.orthographic}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Place Names */}
      <Card>
        <CardHeader>
          <CardTitle>Place Names</CardTitle>
          <CardDescription>
            Generate names for locations, cities, and regions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGeneratePlaceNames}>
            Generate Place Names
          </Button>

          {placeNames.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Names</Label>
                {onAddToLexicon && placeNames.some(n => n.selected) && (
                  <Button size="sm" onClick={() => handleAddToLexicon('place')}>
                    Add {placeNames.filter(n => n.selected).length} to Lexicon
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {placeNames.map((name, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-secondary/50 ${
                      name.selected ? 'bg-secondary' : ''
                    }`}
                    onClick={() => toggleSelection('place', i)}
                  >
                    <Checkbox checked={name.selected} />
                    <span className="font-medium truncate">{name.orthographic}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Faction Names */}
      <Card>
        <CardHeader>
          <CardTitle>Faction Names</CardTitle>
          <CardDescription>
            Generate names for groups, clans, and organizations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Descriptor Suffixes (comma-separated)</Label>
            <Input
              placeholder="e.g., the Great, of the North"
              value={(factionConfig?.descriptorSuffix || []).join(', ')}
              onChange={(e) => updateConfig('faction', {
                descriptorSuffix: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {DEFAULT_DESCRIPTORS.map(desc => (
                <Button
                  key={desc}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    const current = factionConfig?.descriptorSuffix || []
                    if (!current.includes(desc)) {
                      updateConfig('faction', { descriptorSuffix: [...current, desc] })
                    }
                  }}
                >
                  + {desc}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerateFactionNames}>
            Generate Faction Names
          </Button>

          {factionNames.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Names</Label>
                {onAddToLexicon && factionNames.some(n => n.selected) && (
                  <Button size="sm" onClick={() => handleAddToLexicon('faction')}>
                    Add {factionNames.filter(n => n.selected).length} to Lexicon
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {factionNames.map((name, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-secondary/50 ${
                      name.selected ? 'bg-secondary' : ''
                    }`}
                    onClick={() => toggleSelection('faction', i)}
                  >
                    <Checkbox checked={name.selected} />
                    <span className="font-medium truncate">{name.orthographic}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

