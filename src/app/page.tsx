import { LanguageEditor } from '@/components/LanguageEditor'
import { createClient as createTypedClient } from '@/lib/supabase/server'
import { Language } from '@/lib/supabase/types'

async function createClient() {
  const client = await createTypedClient()
  return client as any
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let languages: Language[] = []
  if (user) {
    const { data } = await supabase
      .from('languages')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    languages = data || []
  }

  return <LanguageEditor initialLanguages={languages} user={user} />
}
