import { headers } from 'next/headers'
import { LanguageEditor } from '@/components/LanguageEditor'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { languages } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user ?? null

  const userLanguages = user
    ? await db
        .select()
        .from(languages)
        .where(eq(languages.userId, user.id))
        .orderBy(desc(languages.updatedAt))
    : []

  return <LanguageEditor initialLanguages={userLanguages} user={user} />
}
