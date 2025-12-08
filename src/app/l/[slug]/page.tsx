import { createClient as createTypedClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LexiconEntry, Language } from '@/lib/supabase/types'
import { CopyLanguageButton } from '@/components/CopyLanguageButton'
import { ScriptPreview } from '@/components/ScriptPreview'
import { WritingSystem } from '@/lib/script'
import Link from 'next/link'

async function createClient() {
  const client = await createTypedClient()
  return client as any
}

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
    .single() as { data: Language | null }

  if (!language) {
    notFound()
  }

  const { data: lexiconEntries } = await supabase
    .from('lexicon_entries')
    .select('*')
    .eq('language_id', language.id)
    .order('gloss', { ascending: true }) as { data: LexiconEntry[] | null }

  const { data: { user } } = await supabase.auth.getUser()

  // Check if user owns this language
  const isOwner = user && language.user_id === user.id

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header with navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <img src="/conlang-icon.svg" alt="Conlang" className="h-5 w-auto" />
            <span>← Back to Editor</span>
          </Link>
          {!isOwner && (
            <CopyLanguageButton languageId={language.id} user={user} />
          )}
        </div>

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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Seed</h3>
                <code className="text-sm bg-secondary px-2 py-1 rounded">
                  {language.seed}
                </code>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Generator Version</h3>
                <code className="text-sm bg-secondary px-2 py-1 rounded">
                  {language.generator_version}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phonology Summary */}
        {(language.definition as any)?.phonology && (
          <Card>
            <CardHeader>
              <CardTitle>Phonology</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Consonants</h4>
                <div className="flex flex-wrap gap-2">
                  {((language.definition as any).phonology.consonants as string[])?.map(
                    (c: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded font-mono text-sm"
                      >
                        {c}
                      </span>
                    )
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Vowels</h4>
                <div className="flex flex-wrap gap-2">
                  {((language.definition as any).phonology.vowels as string[])?.map(
                    (v: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded font-mono text-sm"
                      >
                        {v}
                      </span>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md font-mono"
                    >
                      {word}
                    </span>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Writing System / Script */}
        {(language.definition as any)?.writingSystem?.glyphs?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Writing System</CardTitle>
              <CardDescription>
                {(language.definition as any).writingSystem.name} - 
                {(language.definition as any).writingSystem.glyphs.length} glyphs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sample text in script */}
              {(language.definition as any)?.sampleWords && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Sample in Script</h4>
                  <div className="border rounded-lg p-4 bg-secondary/20">
                    <ScriptPreview
                      text={((language.definition as any).sampleWords as string[]).slice(0, 5).join(' ')}
                      writingSystem={(language.definition as any).writingSystem as WritingSystem}
                    />
                  </div>
                </div>
              )}
              
              {/* Glyph inventory */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Glyph Inventory</h4>
                <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {((language.definition as any).writingSystem.glyphs as any[]).map((glyph: any) => (
                    <div
                      key={glyph.id}
                      className="p-2 border rounded text-center"
                      title={glyph.name}
                    >
                      <div
                        className="w-8 h-8 mx-auto"
                        dangerouslySetInnerHTML={{ __html: glyph.svg }}
                      />
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {glyph.name}
                      </div>
                    </div>
                  ))}
                </div>
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

        {/* Footer CTA for non-owners */}
        {!isOwner && (
          <Card className="bg-secondary/50">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">Like this language?</h3>
                  <p className="text-sm text-muted-foreground">
                    Copy it to your account to customize and expand it.
                  </p>
                </div>
                <CopyLanguageButton languageId={language.id} user={user} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
