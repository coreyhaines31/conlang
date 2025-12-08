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
          definition?: Json
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