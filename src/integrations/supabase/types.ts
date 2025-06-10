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
      tags: {
        Row: {
          id: string
          organization_id: string
          created_at: string
          updated_at: string
          name: string
          color: string
        }
        Insert: {
          id?: string
          organization_id: string
          created_at?: string
          updated_at?: string
          name: string
          color: string
        }
        Update: {
          id?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
          name?: string
          color?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_tags: {
        Row: {
          contact_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          contact_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          contact_id?: string
          tag_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}