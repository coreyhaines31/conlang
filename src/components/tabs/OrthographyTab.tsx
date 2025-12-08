'use client'

import { useState } from 'react'
import { LanguageDefinition } from '@/lib/generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface OrthographyTabProps {
  definition: LanguageDefinition
  onUpdate: (updates: Partial<LanguageDefinition>) => void
}

export function OrthographyTab({ definition, onUpdate }: OrthographyTabProps) {
  const orthography = definition.orthography || { mappings: {} }
  const [phoneme, setPhoneme] = useState('')
  const [grapheme, setGrapheme] = useState('')

  const addMapping = () => {
    if (!phoneme || !grapheme) return

    onUpdate({
      orthography: {
        mappings: {
          ...orthography.mappings,
          [phoneme]: grapheme,
        },
      },
    })

    setPhoneme('')
    setGrapheme('')
  }

  const removeMapping = (phoneme: string) => {
    const newMappings = { ...orthography.mappings }
    delete newMappings[phoneme]
    onUpdate({
      orthography: {
        mappings: newMappings,
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orthography</CardTitle>
        <CardDescription>
          Map phonemes to graphemes for written representation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Label>Phoneme</Label>
            <Input
              value={phoneme}
              onChange={(e) => setPhoneme(e.target.value)}
              placeholder="e.g., k"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addMapping()
                }
              }}
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label>Grapheme</Label>
            <Input
              value={grapheme}
              onChange={(e) => setGrapheme(e.target.value)}
              placeholder="e.g., c"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addMapping()
                }
              }}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={addMapping}>Add</Button>
          </div>
        </div>

        {Object.keys(orthography.mappings).length > 0 && (
          <div>
            <Label>Mappings</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phoneme</TableHead>
                  <TableHead>Grapheme</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(orthography.mappings).map(([p, g]) => (
                  <TableRow key={p}>
                    <TableCell>
                      <code>{p}</code>
                    </TableCell>
                    <TableCell>
                      <code>{g as string}</code>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMapping(p)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          If no mappings are defined, phonemic forms will be used as orthographic forms.
        </p>
      </CardContent>
    </Card>
  )
}

