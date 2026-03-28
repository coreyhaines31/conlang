import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { languages } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(languages)
    .where(eq(languages.isPublic, true))

  return NextResponse.json({
    success: true,
    message: 'Neon keep-alive ping successful',
    publicLanguages: count,
    timestamp: new Date().toISOString(),
  })
}
