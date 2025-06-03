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
          }
        ]
      }
      // Aquí van las tablas existentes...
      
      // Nuevas tablas de WhatsApp
      whatsapp_config: {
        Row: {
          id: string
          organization_id: string
          webhook_url: string | null
          bot_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          webhook_url?: string | null
          bot_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          webhook_url?: string | null
          bot_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      whatsapp_phone_config: {
        Row: {
          id: string
          organization_id: string
          phone_number: string
          contact_id: string | null
          bot_enabled: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          phone_number: string
          contact_id?: string | null
          bot_enabled?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          phone_number?: string
          contact_id?: string | null
          bot_enabled?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_phone_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_phone_config_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      whatsapp_messages: {
        Row: {
          id: string
          organization_id: string
          phone_number: string
          message: string
          timestamp: string
          is_from_admin: boolean
          is_from_bot: boolean
          media_url: string | null
          media_type: string | null
          contact_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          phone_number: string
          message: string
          timestamp?: string
          is_from_admin?: boolean
          is_from_bot?: boolean
          media_url?: string | null
          media_type?: string | null
          contact_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          phone_number?: string
          message?: string
          timestamp?: string
          is_from_admin?: boolean
          is_from_bot?: boolean
          media_url?: string | null
          media_type?: string | null
          contact_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_whatsapp_chats: {
        Args: {
          org_id: string
        }
        Returns: {
          phone_number: string
          last_message: string
          last_message_at: string
          unread_count: number
          contact_id: string | null
          contact_name: string | null
        }[]
      }
      get_or_create_phone_config: {
        Args: {
          org_id: string
          phone_num: string
          contact_id?: string
          bot_enabled_val?: boolean
        }
        Returns: string
      }
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
    }
    Enums: {
      app_role: "superadmin" | "admin" | "member"
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never
