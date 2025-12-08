import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-4">{language.name}</h1>

          <div className="text-sm text-gray-500 mb-6">
            Created: {new Date(language.created_at).toLocaleDateString()}
            {' • '}
            Updated: {new Date(language.updated_at).toLocaleDateString()}
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Language Definition</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
                {JSON.stringify(language.definition, null, 2)}
              </pre>
            </div>

            {language.definition?.sampleWords && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Sample Words</h2>
                <div className="flex flex-wrap gap-2">
                  {(language.definition.sampleWords as string[]).map((word: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}