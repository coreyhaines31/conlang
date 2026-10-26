import { headers } from 'next/headers'
import Script from 'next/script'
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

  return (
    <>
      <LanguageEditor initialLanguages={userLanguages} user={user} />
      {/* UserProof records clicks and page text: anonymous visitors only, never a signed-in user's languages. */}
      {!user && (
        <Script
          src="https://ingest.getuserproof.com/sdk.js"
          data-site="898e3209-9d3d-41a2-9856-5ca1b3b81fa9"
          strategy="afterInteractive"
        />
      )}
    </>
  )
}
