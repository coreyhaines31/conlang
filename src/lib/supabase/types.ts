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
      snapshots: {
        Row: {
          id: string
          language_id: string
          name: string | null
          description: string | null
          definition: Json
          lexicon_count: number
          created_at: string
        }
        Insert: {
          id?: string
          language_id: string
          name?: string | null
          description?: string | null
          definition: Json
          lexicon_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          language_id?: string
          name?: string | null
          description?: string | null
          definition?: Json
          lexicon_count?: number
          created_at?: string
        }
      }
      presets: {
        Row: {
          id: string
          user_id: string
          type: 'phonology' | 'phonotactics' | 'morphology' | 'full'
          name: string
          description: string | null
          content: Json
          tags: string[]
          downloads: number
          is_official: boolean
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'phonology' | 'phonotactics' | 'morphology' | 'full'
          name: string
          description?: string | null
          content: Json
          tags?: string[]
          downloads?: number
          is_official?: boolean
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'phonology' | 'phonotactics' | 'morphology' | 'full'
          name?: string
          description?: string | null
          content?: Json
          tags?: string[]
          downloads?: number
          is_official?: boolean
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      community_phrase_packs: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string
          phrases: Json
          tags: string[]
          downloads: number
          is_official: boolean
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          category: string
          phrases: Json
          tags?: string[]
          downloads?: number
          is_official?: boolean
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          category?: string
          phrases?: Json
          tags?: string[]
          downloads?: number
          is_official?: boolean
          is_public?: boolean
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

export type Snapshot = Database['public']['Tables']['snapshots']['Row']
export type SnapshotInsert = Database['public']['Tables']['snapshots']['Insert']
export type SnapshotUpdate = Database['public']['Tables']['snapshots']['Update']

export type Preset = Database['public']['Tables']['presets']['Row']
export type PresetInsert = Database['public']['Tables']['presets']['Insert']
export type PresetUpdate = Database['public']['Tables']['presets']['Update']

export type CommunityPhrasePack = Database['public']['Tables']['community_phrase_packs']['Row']
export type CommunityPhrasePackInsert = Database['public']['Tables']['community_phrase_packs']['Insert']
export type CommunityPhrasePackUpdate = Database['public']['Tables']['community_phrase_packs']['Update']