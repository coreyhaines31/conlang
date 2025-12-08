import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LexiconEntry } from '@/lib/supabase/types'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function PublicLanguagePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: language } = await supabase
    .from('languages')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (!language) {
    notFound()
  }

  const { data: lexiconEntries } = await supabase
    .from('lexicon_entries')
    .select('*')
    .eq('language_id', language.id)
    .order('gloss', { ascending: true })

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{language.name}</CardTitle>
            <CardDescription>
              Created: {new Date(language.created_at).toLocaleDateString()}
              {' • '}
              Updated: {new Date(language.updated_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Seed</h3>
                <code className="text-sm bg-secondary px-2 py-1 rounded">
                  {language.seed}
                </code>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Generator Version</h3>
                <code className="text-sm bg-secondary px-2 py-1 rounded">
                  {language.generator_version}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {(language.definition as any)?.sampleWords && (
          <Card>
            <CardHeader>
              <CardTitle>Sample Words</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {((language.definition as any).sampleWords as string[]).map(
                  (word: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md"
                    >
                      {word}
                    </span>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {lexiconEntries && lexiconEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Lexicon</CardTitle>
              <CardDescription>
                {lexiconEntries.length} {lexiconEntries.length === 1 ? 'entry' : 'entries'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gloss</TableHead>
                    <TableHead>Part of Speech</TableHead>
                    <TableHead>Phonemic</TableHead>
                    <TableHead>Orthographic</TableHead>
                    <TableHead>Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lexiconEntries.map((entry: LexiconEntry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.gloss}</TableCell>
                      <TableCell>{entry.part_of_speech || '-'}</TableCell>
                      <TableCell>
                        <code className="text-sm">{entry.phonemic_form || '-'}</code>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{entry.orthographic_form || '-'}</code>
                      </TableCell>
                      <TableCell>
                        {entry.tags && entry.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}