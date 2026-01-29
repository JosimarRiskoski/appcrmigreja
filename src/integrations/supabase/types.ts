export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      visitors: {
        Row: {
          id: string
          church_id: string
          full_name: string
          phone: string
          email: string | null
          first_visit_date: string
          notes: string | null
          tag: string | null
          status: string
          history: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          church_id: string
          full_name: string
          phone: string
          email?: string | null
          first_visit_date: string
          notes?: string | null
          tag?: string | null
          status: string
          history?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          church_id?: string
          full_name?: string
          phone?: string
          email?: string | null
          first_visit_date?: string
          notes?: string | null
          tag?: string | null
          status?: string
          history?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitors_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      cells: {
        Row: {
          church_id: string
          created_at: string | null
          description: string | null
          id: string
          leader_id: string | null
          meeting_day: string | null
          meeting_location: string | null
          meeting_time: string | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          church_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          leader_id?: string | null
          meeting_day?: string | null
          meeting_location?: string | null
          meeting_time?: string | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          church_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          leader_id?: string | null
          meeting_day?: string | null
          meeting_location?: string | null
          meeting_time?: string | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cells_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cells_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      liturgy_order_items: {
        Row: {
          id: string
          liturgy_id: string
          position: number
          title: string
          notes: string | null
          duration_minutes: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          liturgy_id: string
          position: number
          title: string
          notes?: string | null
          duration_minutes?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          liturgy_id?: string
          position?: number
          title?: string
          notes?: string | null
          duration_minutes?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "liturgy_order_items_liturgy_id_fkey"
            columns: ["liturgy_id"]
            isOneToOne: false
            referencedRelation: "liturgies"
            referencedColumns: ["id"]
          },
        ]
      }
      liturgies: {
        Row: {
          church_id: string
          created_at: string | null
          created_by: string | null
          event_date: string
          id: string
          location: string | null
          minister: string
          theme: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          church_id: string
          created_at?: string | null
          created_by?: string | null
          event_date: string
          id?: string
          location?: string | null
          minister: string
          theme: string
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          church_id?: string
          created_at?: string | null
          created_by?: string | null
          event_date?: string
          id?: string
          location?: string | null
          minister?: string
          theme?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "liturgies_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      churches: {
        Row: {
          address: string | null
          app_code: string | null
          city: string | null
          created_at: string | null
          current_plan: Database["public"]["Enums"]["plan_type"] | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          plan_expires_at: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string
          state: string | null
          trial_end_date: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          app_code?: string | null
          city?: string | null
          created_at?: string | null
          current_plan?: Database["public"]["Enums"]["plan_type"] | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          plan_expires_at?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          state?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          app_code?: string | null
          city?: string | null
          created_at?: string | null
          current_plan?: Database["public"]["Enums"]["plan_type"] | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          plan_expires_at?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          state?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      event_attendance: {
        Row: {
          checked_in_at: string | null
          event_id: string
          id: string
          member_id: string | null
          visitor_name: string | null
          visitor_phone: string | null
        }
        Insert: {
          checked_in_at?: string | null
          event_id: string
          id?: string
          member_id?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Update: {
          checked_in_at?: string | null
          event_id?: string
          id?: string
          member_id?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          church_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          event_date: string
          id: string
          location: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          church_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          location?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          church_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          location?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          baptized: boolean | null
          birth_date: string | null
          cell_id: string | null
          church_id: string
          city: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          member_since: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          zip_code: string | null
          status: Database["public"]["Enums"]["member_status"] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          baptized?: boolean | null
          birth_date?: string | null
          cell_id?: string | null
          church_id: string
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          member_since?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          zip_code?: string | null
          status?: Database["public"]["Enums"]["member_status"] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          baptized?: boolean | null
          birth_date?: string | null
          cell_id?: string | null
          church_id?: string
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          member_since?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          zip_code?: string | null
          status?: Database["public"]["Enums"]["member_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: false
            referencedRelation: "cells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      ministries: {
        Row: {
          church_id: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          leader_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          church_id: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          leader_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          church_id?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          leader_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ministries_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministries_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      ministry_members: {
        Row: {
          joined_at: string | null
          member_id: string
          ministry_id: string
        }
        Insert: {
          joined_at?: string | null
          member_id: string
          ministry_id: string
        }
        Update: {
          joined_at?: string | null
          member_id?: string
          ministry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministry_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministry_members_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          church_id: string
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          member_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          church_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          member_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          church_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          member_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prayer_requests_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          church_id: string | null
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          church_id?: string | null
          created_at?: string | null
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          church_id?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      media_library: {
        Row: {
          id: string
          church_id: string
          title: string
          description: string | null
          category: string
          storage_path: string
          public_url: string | null
          share_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          church_id: string
          title: string
          description?: string | null
          category: string
          storage_path: string
          public_url?: string | null
          share_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          church_id?: string
          title?: string
          description?: string | null
          category?: string
          storage_path?: string
          public_url?: string | null
          share_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_library_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          church_id: string
          data: Json
          updated_at: string | null
        }
        Insert: {
          church_id: string
          data: Json
          updated_at?: string | null
        }
        Update: {
          church_id?: string
          data?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          id: string
          event_id: string
          member_id: string | null
          visitor_name: string | null
          visitor_phone: string | null
          checked_in_at: string
        }
        Insert: {
          id?: string
          event_id: string
          member_id?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
          checked_in_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          member_id?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
          checked_in_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_app_code: { Args: never; Returns: string }
    }
    Enums: {
      member_status: "ativo" | "inativo" | "visitante"
      plan_type: "trial" | "essencial" | "avancado" | "premium"
      user_role: "admin" | "lider" | "membro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      member_status: ["ativo", "inativo", "visitante"],
      plan_type: ["trial", "essencial", "avancado", "premium"],
      user_role: ["admin", "lider", "membro"],
    },
  },
} as const
