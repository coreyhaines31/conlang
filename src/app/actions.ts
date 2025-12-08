'use server'

import { createClient as createTypedClient } from '@/lib/supabase/server'

// Helper to get an untyped supabase client for flexible queries
async function createClient() {
  const client = await createTypedClient()
  return client as any
}
import { revalidatePath } from 'next/cache'
import { Language, LexiconEntry, Snapshot, Preset, CommunityPhrasePack } from '@/lib/supabase/types'

export async function saveLanguage(
  name: string,
  slug: string,
  definition: any,
  seed: number,
  generatorVersion: string,
  isPublic: boolean
): Promise<Language | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('languages')
    .insert({
      user_id: user.id,
      name,
      slug,
      definition,
      seed,
      generator_version: generatorVersion,
      is_public: isPublic,
    } as any)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/')
  return data
}

export async function updateLanguage(
  id: string,
  name: string,
  definition: any,
  seed: number,
  generatorVersion: string,
  isPublic: boolean
): Promise<Language | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('languages')
    .update({
      name,
      definition,
      seed,
      generator_version: generatorVersion,
      is_public: isPublic,
    } as any)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/')
  revalidatePath(`/l/${data.slug}`)
  return data
}

export async function deleteLanguage(id: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('languages')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/')
  return true
}

// Lexicon CRUD
export async function createLexiconEntry(
  languageId: string,
  gloss: string,
  partOfSpeech?: string,
  phonemicForm?: string,
  orthographicForm?: string,
  tags?: string[],
  notes?: string
): Promise<LexiconEntry | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('lexicon_entries')
    .insert({
      language_id: languageId,
      gloss,
      part_of_speech: partOfSpeech || null,
      phonemic_form: phonemicForm || null,
      orthographic_form: orthographicForm || null,
      tags: tags || [],
      notes: notes || null,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/')
  return data
}

export async function updateLexiconEntry(
  id: string,
  gloss: string,
  partOfSpeech?: string,
  phonemicForm?: string,
  orthographicForm?: string,
  tags?: string[],
  notes?: string
): Promise<LexiconEntry | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('lexicon_entries')
    .update({
      gloss,
      part_of_speech: partOfSpeech || null,
      phonemic_form: phonemicForm || null,
      orthographic_form: orthographicForm || null,
      tags: tags || [],
      notes: notes || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/')
  return data
}

export async function deleteLexiconEntry(id: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('lexicon_entries')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/')
  return true
}

export async function getLexiconEntries(languageId: string): Promise<LexiconEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lexicon_entries')
    .select('*')
    .eq('language_id', languageId)
    .order('gloss', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createSlug(name: string): Promise<string> {
  const supabase = await createClient()

  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  let slug = baseSlug
  let counter = 2

  // Check for uniqueness
  while (true) {
    const { data } = await supabase
      .from('languages')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!data) break

    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

export async function duplicateLanguage(languageId: string): Promise<Language | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get the original language
  const { data: original, error: fetchError } = await supabase
    .from('languages')
    .select('*')
    .eq('id', languageId)
    .single()

  if (fetchError || !original) throw new Error('Language not found')

  // Create a new slug for the copy
  const newName = `${original.name} (Copy)`
  const newSlug = await createSlug(newName)

  // Create the duplicate
  const { data, error } = await supabase
    .from('languages')
    .insert({
      user_id: user.id,
      name: newName,
      slug: newSlug,
      definition: original.definition,
      seed: original.seed,
      generator_version: original.generator_version,
      is_public: false, // Always start as private
    } as any)
    .select()
    .single()

  if (error) throw error

  // Optionally copy lexicon entries too
  const { data: lexiconEntries } = await supabase
    .from('lexicon_entries')
    .select('*')
    .eq('language_id', languageId)

  if (lexiconEntries && lexiconEntries.length > 0) {
    const newEntries = lexiconEntries.map((entry: any) => ({
      language_id: data.id,
      gloss: entry.gloss,
      part_of_speech: entry.part_of_speech,
      phonemic_form: entry.phonemic_form,
      orthographic_form: entry.orthographic_form,
      tags: entry.tags,
      notes: entry.notes,
    }))

    await supabase.from('lexicon_entries').insert(newEntries)
  }

  revalidatePath('/')
  return data
}

export async function copyPublicLanguage(languageId: string): Promise<Language | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get the public language (must be public)
  const { data: original, error: fetchError } = await supabase
    .from('languages')
    .select('*')
    .eq('id', languageId)
    .eq('is_public', true)
    .single()

  if (fetchError || !original) throw new Error('Public language not found')

  // Create a new slug for the copy
  const newName = `${original.name} (Copy)`
  const newSlug = await createSlug(newName)

  // Create the copy
  const { data, error } = await supabase
    .from('languages')
    .insert({
      user_id: user.id,
      name: newName,
      slug: newSlug,
      definition: original.definition,
      seed: original.seed,
      generator_version: original.generator_version,
      is_public: false, // Start as private
    } as any)
    .select()
    .single()

  if (error) throw error

  // Copy lexicon entries too
  const { data: lexiconEntries } = await supabase
    .from('lexicon_entries')
    .select('*')
    .eq('language_id', languageId)

  if (lexiconEntries && lexiconEntries.length > 0) {
    const newEntries = lexiconEntries.map((entry: any) => ({
      language_id: data.id,
      gloss: entry.gloss,
      part_of_speech: entry.part_of_speech,
      phonemic_form: entry.phonemic_form,
      orthographic_form: entry.orthographic_form,
      tags: entry.tags,
      notes: entry.notes,
    }))

    await supabase.from('lexicon_entries').insert(newEntries)
  }

  revalidatePath('/')
  return data
}

// ===== SNAPSHOTS (VERSION HISTORY) =====

export async function createSnapshot(
  languageId: string,
  name?: string,
  description?: string
): Promise<Snapshot | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get current language definition
  const { data: language } = await supabase
    .from('languages')
    .select('definition')
    .eq('id', languageId)
    .eq('user_id', user.id)
    .single()

  if (!language) throw new Error('Language not found')

  // Count lexicon entries
  const { count } = await supabase
    .from('lexicon_entries')
    .select('*', { count: 'exact', head: true })
    .eq('language_id', languageId)

  const { data, error } = await supabase
    .from('snapshots')
    .insert({
      language_id: languageId,
      name: name || null,
      description: description || null,
      definition: language.definition,
      lexicon_count: count || 0,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/')
  return data
}

export async function getSnapshots(languageId: string): Promise<Snapshot[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('snapshots')
    .select('*')
    .eq('language_id', languageId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function deleteSnapshot(id: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('snapshots')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/')
  return true
}

export async function restoreSnapshot(snapshotId: string): Promise<Language | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get the snapshot
  const { data: snapshot, error: snapshotError } = await supabase
    .from('snapshots')
    .select('*')
    .eq('id', snapshotId)
    .single()

  if (snapshotError || !snapshot) throw new Error('Snapshot not found')

  // Update the language definition
  const { data, error } = await supabase
    .from('languages')
    .update({
      definition: snapshot.definition,
    })
    .eq('id', snapshot.language_id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/')
  return data
}

// ===== PRESETS (MARKETPLACE) =====

export async function createPreset(
  type: 'phonology' | 'phonotactics' | 'morphology' | 'full',
  name: string,
  description: string,
  content: any,
  tags?: string[]
): Promise<Preset | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('presets')
    .insert({
      user_id: user.id,
      type,
      name,
      description,
      content,
      tags: tags || [],
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/presets')
  return data
}

export async function getPresets(
  type?: 'phonology' | 'phonotactics' | 'morphology' | 'full',
  limit?: number
): Promise<Preset[]> {
  const supabase = await createClient()

  let query = supabase
    .from('presets')
    .select('*')
    .eq('is_public', true)
    .order('downloads', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getMyPresets(): Promise<Preset[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('presets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function deletePreset(id: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('presets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/presets')
  return true
}

// ===== COMMUNITY PHRASE PACKS =====

export async function createCommunityPhrasePack(
  name: string,
  description: string,
  category: string,
  phrases: any[],
  tags?: string[]
): Promise<CommunityPhrasePack | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('community_phrase_packs')
    .insert({
      user_id: user.id,
      name,
      description,
      category,
      phrases,
      tags: tags || [],
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/phrase-packs')
  return data
}

export async function getCommunityPhrasePacks(
  category?: string,
  limit?: number
): Promise<CommunityPhrasePack[]> {
  const supabase = await createClient()

  let query = supabase
    .from('community_phrase_packs')
    .select('*')
    .eq('is_public', true)
    .order('downloads', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getMyCommunityPhrasePacks(): Promise<CommunityPhrasePack[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('community_phrase_packs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function deleteCommunityPhrasePack(id: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('community_phrase_packs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/phrase-packs')
  return true
}

// ===== SHARE LINK GENERATION =====

export async function getShareUrl(languageId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('languages')
    .select('slug, is_public')
    .eq('id', languageId)
    .single()

  if (error || !data) return null
  if (!data.is_public) return null

  return `/l/${data.slug}`
}