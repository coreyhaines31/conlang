'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { eq, asc, desc, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  languages,
  lexiconEntries,
  snapshots,
  presets,
  communityPhrasePacks,
  type Language,
  type LexiconEntry,
  type Snapshot,
  type Preset,
  type CommunityPhrasePack,
} from '@/lib/db/schema'
import { auth } from '@/lib/auth'

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Not authenticated')
  return session.user
}

// ===== LANGUAGES =====

export async function saveLanguage(
  name: string,
  slug: string,
  definition: unknown,
  seed: number,
  generatorVersion: string,
  isPublic: boolean
): Promise<Language> {
  const user = await requireUser()

  const [row] = await db
    .insert(languages)
    .values({ userId: user.id, name, slug, definition, seed, generatorVersion, isPublic })
    .returning()

  revalidatePath('/')
  return row
}

export async function updateLanguage(
  id: string,
  name: string,
  definition: unknown,
  seed: number,
  generatorVersion: string,
  isPublic: boolean
): Promise<Language> {
  const user = await requireUser()

  const [row] = await db
    .update(languages)
    .set({ name, definition, seed, generatorVersion, isPublic, updatedAt: new Date() })
    .where(and(eq(languages.id, id), eq(languages.userId, user.id)))
    .returning()

  if (!row) throw new Error('Language not found')

  revalidatePath('/')
  revalidatePath(`/l/${row.slug}`)
  return row
}

export async function deleteLanguage(id: string): Promise<boolean> {
  const user = await requireUser()

  await db
    .delete(languages)
    .where(and(eq(languages.id, id), eq(languages.userId, user.id)))

  revalidatePath('/')
  return true
}

export async function createSlug(name: string): Promise<string> {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  let slug = baseSlug
  let counter = 2

  while (true) {
    const existing = await db
      .select({ id: languages.id })
      .from(languages)
      .where(eq(languages.slug, slug))
      .limit(1)

    if (existing.length === 0) break
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

export async function duplicateLanguage(languageId: string): Promise<Language> {
  const user = await requireUser()

  const [original] = await db
    .select()
    .from(languages)
    .where(eq(languages.id, languageId))
    .limit(1)

  if (!original) throw new Error('Language not found')

  const newName = `${original.name} (Copy)`
  const newSlug = await createSlug(newName)

  const [newLang] = await db
    .insert(languages)
    .values({
      userId: user.id,
      name: newName,
      slug: newSlug,
      definition: original.definition,
      seed: original.seed,
      generatorVersion: original.generatorVersion,
      isPublic: false,
    })
    .returning()

  const entries = await db
    .select()
    .from(lexiconEntries)
    .where(eq(lexiconEntries.languageId, languageId))

  if (entries.length > 0) {
    await db.insert(lexiconEntries).values(
      entries.map((e) => ({
        languageId: newLang.id,
        gloss: e.gloss,
        partOfSpeech: e.partOfSpeech,
        phonemicForm: e.phonemicForm,
        orthographicForm: e.orthographicForm,
        tags: e.tags,
        notes: e.notes,
      }))
    )
  }

  revalidatePath('/')
  return newLang
}

export async function copyPublicLanguage(languageId: string): Promise<Language> {
  const user = await requireUser()

  const [original] = await db
    .select()
    .from(languages)
    .where(and(eq(languages.id, languageId), eq(languages.isPublic, true)))
    .limit(1)

  if (!original) throw new Error('Public language not found')

  const newName = `${original.name} (Copy)`
  const newSlug = await createSlug(newName)

  const [newLang] = await db
    .insert(languages)
    .values({
      userId: user.id,
      name: newName,
      slug: newSlug,
      definition: original.definition,
      seed: original.seed,
      generatorVersion: original.generatorVersion,
      isPublic: false,
    })
    .returning()

  const entries = await db
    .select()
    .from(lexiconEntries)
    .where(eq(lexiconEntries.languageId, languageId))

  if (entries.length > 0) {
    await db.insert(lexiconEntries).values(
      entries.map((e) => ({
        languageId: newLang.id,
        gloss: e.gloss,
        partOfSpeech: e.partOfSpeech,
        phonemicForm: e.phonemicForm,
        orthographicForm: e.orthographicForm,
        tags: e.tags,
        notes: e.notes,
      }))
    )
  }

  revalidatePath('/')
  return newLang
}

// ===== LEXICON =====

export async function createLexiconEntry(
  languageId: string,
  gloss: string,
  partOfSpeech?: string,
  phonemicForm?: string,
  orthographicForm?: string,
  tags?: string[],
  notes?: string
): Promise<LexiconEntry> {
  await requireUser()

  const [row] = await db
    .insert(lexiconEntries)
    .values({
      languageId,
      gloss,
      partOfSpeech: partOfSpeech ?? null,
      phonemicForm: phonemicForm ?? null,
      orthographicForm: orthographicForm ?? null,
      tags: tags ?? [],
      notes: notes ?? null,
    })
    .returning()

  revalidatePath('/')
  return row
}

export async function updateLexiconEntry(
  id: string,
  gloss: string,
  partOfSpeech?: string,
  phonemicForm?: string,
  orthographicForm?: string,
  tags?: string[],
  notes?: string
): Promise<LexiconEntry> {
  await requireUser()

  const [row] = await db
    .update(lexiconEntries)
    .set({
      gloss,
      partOfSpeech: partOfSpeech ?? null,
      phonemicForm: phonemicForm ?? null,
      orthographicForm: orthographicForm ?? null,
      tags: tags ?? [],
      notes: notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(lexiconEntries.id, id))
    .returning()

  if (!row) throw new Error('Entry not found')

  revalidatePath('/')
  return row
}

export async function deleteLexiconEntry(id: string): Promise<boolean> {
  await requireUser()

  await db.delete(lexiconEntries).where(eq(lexiconEntries.id, id))

  revalidatePath('/')
  return true
}

export async function getLexiconEntries(languageId: string): Promise<LexiconEntry[]> {
  return db
    .select()
    .from(lexiconEntries)
    .where(eq(lexiconEntries.languageId, languageId))
    .orderBy(asc(lexiconEntries.gloss))
}

// ===== SNAPSHOTS =====

export async function createSnapshot(
  languageId: string,
  name?: string,
  description?: string
): Promise<Snapshot> {
  const user = await requireUser()

  const [lang] = await db
    .select({ definition: languages.definition })
    .from(languages)
    .where(and(eq(languages.id, languageId), eq(languages.userId, user.id)))
    .limit(1)

  if (!lang) throw new Error('Language not found')

  const entryCount = await db
    .select({ id: lexiconEntries.id })
    .from(lexiconEntries)
    .where(eq(lexiconEntries.languageId, languageId))

  const [row] = await db
    .insert(snapshots)
    .values({
      languageId,
      name: name ?? null,
      description: description ?? null,
      definition: lang.definition,
      lexiconCount: entryCount.length,
    })
    .returning()

  revalidatePath('/')
  return row
}

export async function getSnapshots(languageId: string): Promise<Snapshot[]> {
  return db
    .select()
    .from(snapshots)
    .where(eq(snapshots.languageId, languageId))
    .orderBy(desc(snapshots.createdAt))
}

export async function deleteSnapshot(id: string): Promise<boolean> {
  await requireUser()

  await db.delete(snapshots).where(eq(snapshots.id, id))

  revalidatePath('/')
  return true
}

export async function restoreSnapshot(snapshotId: string): Promise<Language> {
  const user = await requireUser()

  const [snapshot] = await db
    .select()
    .from(snapshots)
    .where(eq(snapshots.id, snapshotId))
    .limit(1)

  if (!snapshot) throw new Error('Snapshot not found')

  const [row] = await db
    .update(languages)
    .set({ definition: snapshot.definition, updatedAt: new Date() })
    .where(and(eq(languages.id, snapshot.languageId), eq(languages.userId, user.id)))
    .returning()

  if (!row) throw new Error('Language not found')

  revalidatePath('/')
  return row
}

// ===== PRESETS =====

export async function createPreset(
  type: 'phonology' | 'phonotactics' | 'morphology' | 'full',
  name: string,
  description: string,
  content: unknown,
  tags?: string[]
): Promise<Preset> {
  const user = await requireUser()

  const [row] = await db
    .insert(presets)
    .values({ userId: user.id, type, name, description, content, tags: tags ?? [] })
    .returning()

  revalidatePath('/presets')
  return row
}

export async function getPresets(
  type?: 'phonology' | 'phonotactics' | 'morphology' | 'full',
  limit?: number
): Promise<Preset[]> {
  const query = db
    .select()
    .from(presets)
    .where(type ? and(eq(presets.isPublic, true), eq(presets.type, type)) : eq(presets.isPublic, true))
    .orderBy(desc(presets.downloads))

  if (limit) return (query as any).limit(limit)
  return query
}

export async function getMyPresets(): Promise<Preset[]> {
  const user = await requireUser()

  return db
    .select()
    .from(presets)
    .where(eq(presets.userId, user.id))
    .orderBy(desc(presets.createdAt))
}

export async function deletePreset(id: string): Promise<boolean> {
  const user = await requireUser()

  await db
    .delete(presets)
    .where(and(eq(presets.id, id), eq(presets.userId, user.id)))

  revalidatePath('/presets')
  return true
}

// ===== COMMUNITY PHRASE PACKS =====

export async function createCommunityPhrasePack(
  name: string,
  description: string,
  category: string,
  phrases: unknown[],
  tags?: string[]
): Promise<CommunityPhrasePack> {
  const user = await requireUser()

  const [row] = await db
    .insert(communityPhrasePacks)
    .values({ userId: user.id, name, description, category, phrases, tags: tags ?? [] })
    .returning()

  revalidatePath('/phrase-packs')
  return row
}

export async function getCommunityPhrasePacks(
  category?: string,
  limit?: number
): Promise<CommunityPhrasePack[]> {
  const query = db
    .select()
    .from(communityPhrasePacks)
    .where(
      category
        ? and(eq(communityPhrasePacks.isPublic, true), eq(communityPhrasePacks.category, category))
        : eq(communityPhrasePacks.isPublic, true)
    )
    .orderBy(desc(communityPhrasePacks.downloads))

  if (limit) return (query as any).limit(limit)
  return query
}

export async function getMyCommunityPhrasePacks(): Promise<CommunityPhrasePack[]> {
  const user = await requireUser()

  return db
    .select()
    .from(communityPhrasePacks)
    .where(eq(communityPhrasePacks.userId, user.id))
    .orderBy(desc(communityPhrasePacks.createdAt))
}

export async function deleteCommunityPhrasePack(id: string): Promise<boolean> {
  const user = await requireUser()

  await db
    .delete(communityPhrasePacks)
    .where(and(eq(communityPhrasePacks.id, id), eq(communityPhrasePacks.userId, user.id)))

  revalidatePath('/phrase-packs')
  return true
}

// ===== SHARE LINK =====

export async function getShareUrl(languageId: string): Promise<string | null> {
  const [row] = await db
    .select({ slug: languages.slug, isPublic: languages.isPublic })
    .from(languages)
    .where(eq(languages.id, languageId))
    .limit(1)

  if (!row || !row.isPublic) return null
  return `/l/${row.slug}`
}
