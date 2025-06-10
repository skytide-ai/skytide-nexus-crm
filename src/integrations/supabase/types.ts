export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          contact_id: string
          created_at: string
          created_by: string
          end_time: string
          id: string
          member_id: string | null
          notes: string | null
          organization_id: string
          service_id: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          contact_id: string
          created_at?: string
          created_by: string
          end_time: string
          id?: string
          member_id?: string | null
          notes?: string | null
          organization_id: string
          service_id?: string | null
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          contact_id?: string
          created_at?: string
          created_by?: string
          end_time?: string
          id?: string
          member_id?: string | null
          notes?: string | null
          organization_id?: string
          service_id?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_identities: {
        Row: {
          bot_enabled: boolean
          contact_id: string | null
          first_seen: string
          id: string
          last_seen: string
          organization_id: string
          platform: Database["public"]["Enums"]["chat_platform"]
          platform_user_id: string
        }
        Insert: {
          bot_enabled?: boolean
          contact_id?: string | null
          first_seen?: string
          id?: string
          last_seen?: string
          organization_id: string
          platform: Database["public"]["Enums"]["chat_platform"]
          platform_user_id: string
        }
        Update: {
          bot_enabled?: boolean
          contact_id?: string | null
          first_seen?: string
          id?: string
          last_seen?: string
          organization_id?: string
          platform?: Database["public"]["Enums"]["chat_platform"]
          platform_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_identities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_identities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_identity_id: string
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          media_mime_type: string | null
          media_type: Database["public"]["Enums"]["media_type"] | null
          media_url: string | null
          message: string | null
          received_via: Database["public"]["Enums"]["chat_platform"]
          sent_by: string | null
          timestamp: string
        }
        Insert: {
          chat_identity_id: string
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          media_mime_type?: string | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          message?: string | null
          received_via: Database["public"]["Enums"]["chat_platform"]
          sent_by?: string | null
          timestamp?: string
        }
        Update: {
          chat_identity_id?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          media_mime_type?: string | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          message?: string | null
          received_via?: Database["public"]["Enums"]["chat_platform"]
          sent_by?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_identity_id_fkey"
            columns: ["chat_identity_id"]
            isOneToOne: false
            referencedRelation: "chat_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_files: {
        Row: {
          contact_id: string
          created_at: string
          created_by: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          created_by: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          created_by?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_files_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_files_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_notes: {
        Row: {
          contact_id: string
          created_at: string
          created_by: string
          id: string
          note: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          created_by: string
          id?: string
          note: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          created_by?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          contact_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          age: number | null
          birth_date: string | null
          city: string | null
          country_code: string
          created_at: string
          created_by: string
          document_number: string | null
          document_type: string | null
          email: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          organization_id: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          age?: number | null
          birth_date?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          created_by: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          organization_id: string
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          age?: number | null
          birth_date?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          created_by?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          organization_id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_contacts: {
        Row: {
          contact_id: string
          created_at: string | null
          funnel_id: string
          id: string
          position: number
          stage_id: string
          updated_at: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          funnel_id: string
          id?: string
          position: number
          stage_id: string
          updated_at?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          funnel_id?: string
          id?: string
          position?: number
          stage_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_contacts_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_contacts_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_stages: {
        Row: {
          color: string
          created_at: string | null
          funnel_id: string
          id: string
          name: string
          position: number
        }
        Insert: {
          color: string
          created_at?: string | null
          funnel_id: string
          id?: string
          name: string
          position: number
        }
        Update: {
          color?: string
          created_at?: string | null
          funnel_id?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "funnel_stages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_availability: {
        Row: {
          break_end_time: string | null
          break_start_time: string | null
          created_at: string
          created_by: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          member_id: string
          organization_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          created_by: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          member_id: string
          organization_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          created_by?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          member_id?: string
          organization_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_availability_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_availability_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_availability_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          first_name: string
          id: string
          invited_by: string
          invited_by_name: string
          last_name: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          first_name: string
          id?: string
          invited_by: string
          invited_by_name: string
          last_name: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          first_name?: string
          id?: string
          invited_by?: string
          invited_by_name?: string
          last_name?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_special_dates: {
        Row: {
          break_end_time: string | null
          break_start_time: string | null
          created_at: string
          created_by: string
          date: string
          end_time: string | null
          id: string
          is_available: boolean
          member_id: string
          organization_id: string
          reason: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          created_by: string
          date: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          member_id: string
          organization_id: string
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          created_by?: string
          date?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          member_id?: string
          organization_id?: string
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_special_dates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_special_dates_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_special_dates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_availability: {
        Row: {
          break_end_time: string | null
          break_start_time: string | null
          created_at: string
          created_by: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          organization_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          created_by: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          organization_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          created_by?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          organization_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_availability_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_availability_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_special_dates: {
        Row: {
          break_end_time: string | null
          break_start_time: string | null
          created_at: string
          created_by: string
          date: string
          end_time: string | null
          id: string
          is_available: boolean
          organization_id: string
          reason: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          created_by: string
          date: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          organization_id: string
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          created_by?: string
          date?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          organization_id?: string
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_special_dates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_special_dates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_webhooks: {
        Row: {
          created_at: string
          id: string
          message_outgoing_webhook_url: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_outgoing_webhook_url: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_outgoing_webhook_url?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name: string
          id: string
          is_active?: boolean | null
          last_name: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          member_id: string
          service_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          member_id: string
          service_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          member_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_assignments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          organization_id: string
          price_cop: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          price_cop: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          price_cop?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dashboard_metrics: {
        Row: {
          appointments_growth: number | null
          conversion_rate: number | null
          conversion_rate_change: number | null
          new_clients: number | null
          new_clients_growth: number | null
          revenue_growth: number | null
          total_appointments: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      monthly_statistics: {
        Row: {
          citas: number | null
          facturacion: number | null
          name: string | null
        }
        Relationships: []
      }
      top_services: {
        Row: {
          citas: number | null
          facturacion: number | null
          name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      clean_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_organization: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_dashboard_stats: {
        Args: {
          p_organization_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          total_appointments: number
          total_completed_appointments: number
          total_revenue: number
          new_contacts: number
          service_id: string
          service_name: string
          service_appointments: number
          service_completed_appointments: number
          service_revenue: number
        }[]
      }
      get_organization_contacts: {
        Args: { org_id: string }
        Returns: {
          id: string
          contact_name: string
          email: string
          phone: string
          created_at: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      app_role: "superadmin" | "admin" | "member"
      chat_platform: "whatsapp" | "messenger" | "instagram"
      media_type: "image" | "audio" | "video" | "file"
      message_direction: "incoming" | "outgoing"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["superadmin", "admin", "member"],
      chat_platform: ["whatsapp", "messenger", "instagram"],
      media_type: ["image", "audio", "video", "file"],
      message_direction: ["incoming", "outgoing"],
    },
  },
} as const
