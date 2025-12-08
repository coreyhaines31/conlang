'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Language, LexiconEntry } from '@/lib/supabase/types'

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
    const newEntries = lexiconEntries.map(entry => ({
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