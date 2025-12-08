'use client'

import { Language } from '@/lib/supabase/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface OverviewTabProps {
  language: Partial<Language>
  onUpdate: (lang: Partial<Language>) => void
  onGenerateWords: () => void
}

export function OverviewTab({ language, onUpdate, onGenerateWords }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core language settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Seed</Label>
            <Input
              type="number"
              value={language.seed || 0}
              onChange={(e) =>
                onUpdate({ ...language, seed: parseInt(e.target.value) || 0 })
              }
              placeholder="Random seed for generation"
            />
            <p className="text-xs text-muted-foreground">
              Same seed + definition = same generated words
            </p>
          </div>

          <div className="space-y-2">
            <Label>Generator Version</Label>
            <Input
              type="text"
              value={language.generator_version || '1.0.0'}
              onChange={(e) =>
                onUpdate({ ...language, generator_version: e.target.value })
              }
              placeholder="1.0.0"
            />
            <p className="text-xs text-muted-foreground">
              Version of the generator algorithm used
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Word Generation</CardTitle>
          <CardDescription>Generate sample words using current settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onGenerateWords} className="w-full">
            Generate 20 Words
          </Button>
          {(language.definition as any)?.sampleWords && (
            <div className="mt-4">
              <Label>Generated Words</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {((language.definition as any).sampleWords as string[]).map((word, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

