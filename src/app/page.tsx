import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Script from 'next/script'
import { LanguageEditor } from '@/components/LanguageEditor'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { languages } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

const title = 'Conlang - Construct Your Language'
const description =
  'Build constructed languages with instant feedback. Define sounds, create words, and bring your language to life.'
const image = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'A new Conlang language generating its first words',
}

// Homepage only: the animated og:video (iMessage, Discord) with its resting frame as the still for everyone else.
export const metadata: Metadata = {
  openGraph: {
    title,
    description,
    url: 'https://conlang.app',
    siteName: 'Conlang',
    images: [image],
    videos: [
      {
        url: 'https://conlang.app/og-video.mp4',
        secureUrl: 'https://conlang.app/og-video.mp4',
        type: 'video/mp4',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: 'Build constructed languages with instant feedback.',
    images: [image.url],
  },
}

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
