import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { db } from '@/lib/db'
import { languages } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization') ?? ''
  if (!safeCompare(authHeader, `Bearer ${expected}`)) {
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
