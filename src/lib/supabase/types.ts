export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      languages: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          is_public: boolean
          seed: number
          generator_version: string
          definition: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          is_public?: boolean
          seed?: number
          generator_version?: string
          definition?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          is_public?: boolean
          seed?: number
          generator_version?: string
          definition?: Json
          created_at?: string
          updated_at?: string
        }
      }
      lexicon_entries: {
        Row: {
          id: string
          language_id: string
          gloss: string
          part_of_speech: string | null
          phonemic_form: string | null
          orthographic_form: string | null
          tags: string[]
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          language_id: string
          gloss: string
          part_of_speech?: string | null
          phonemic_form?: string | null
          orthographic_form?: string | null
          tags?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          language_id?: string
          gloss?: string
          part_of_speech?: string | null
          phonemic_form?: string | null
          orthographic_form?: string | null
          tags?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Language = Database['public']['Tables']['languages']['Row']
export type LanguageInsert = Database['public']['Tables']['languages']['Insert']
export type LanguageUpdate = Database['public']['Tables']['languages']['Update']

export type LexiconEntry = Database['public']['Tables']['lexicon_entries']['Row']
export type LexiconEntryInsert = Database['public']['Tables']['lexicon_entries']['Insert']
export type LexiconEntryUpdate = Database['public']['Tables']['lexicon_entries']['Update']