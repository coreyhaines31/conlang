'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Language } from '@/lib/supabase/types'

export async function saveLanguage(
  name: string,
  slug: string,
  definition: any,
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
      is_public: isPublic,
    })
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
      is_public: isPublic,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/')
  revalidatePath(`/l/${data.slug}`)
  return data
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