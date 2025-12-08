import { LanguageEditor } from '@/components/LanguageEditor'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let languages = []
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