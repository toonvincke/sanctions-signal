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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      authorities: {
        Row: {
          id: string
          jurisdiction_id: string | null
          name: string
          short_name: string
          slug: string
          website: string | null
        }
        Insert: {
          id?: string
          jurisdiction_id?: string | null
          name: string
          short_name: string
          slug: string
          website?: string | null
        }
        Update: {
          id?: string
          jurisdiction_id?: string | null
          name?: string
          short_name?: string
          slug?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authorities_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdictions"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          note: string | null
          record_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          record_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          record_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "intelligence_records"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      intelligence_records: {
        Row: {
          affected_entities: string[]
          affected_sectors: string[]
          authority_id: string | null
          case_number: string | null
          circumvention_methods: string[]
          content_type: Database["public"]["Enums"]["content_type"]
          control_failures: string[]
          created_at: string
          detailed_analysis: string | null
          effective_date: string | null
          event_date: string | null
          executive_summary: string
          headline: string
          id: string
          jurisdiction_id: string | null
          legal_provisions: string[]
          legal_status: Database["public"]["Enums"]["legal_status"]
          penalty_amount: number | null
          penalty_currency: string | null
          practical_implications: string | null
          priority: boolean
          publication_date: string
          regime_id: string | null
          retrieved_at: string | null
          search: unknown
          slug: string
          source_facts: string
          source_publisher: string | null
          source_title: string | null
          source_url: string
          tags: string[]
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          violation: string | null
        }
        Insert: {
          affected_entities?: string[]
          affected_sectors?: string[]
          authority_id?: string | null
          case_number?: string | null
          circumvention_methods?: string[]
          content_type: Database["public"]["Enums"]["content_type"]
          control_failures?: string[]
          created_at?: string
          detailed_analysis?: string | null
          effective_date?: string | null
          event_date?: string | null
          executive_summary: string
          headline: string
          id?: string
          jurisdiction_id?: string | null
          legal_provisions?: string[]
          legal_status?: Database["public"]["Enums"]["legal_status"]
          penalty_amount?: number | null
          penalty_currency?: string | null
          practical_implications?: string | null
          priority?: boolean
          publication_date: string
          regime_id?: string | null
          retrieved_at?: string | null
          search?: unknown
          slug: string
          source_facts: string
          source_publisher?: string | null
          source_title?: string | null
          source_url: string
          tags?: string[]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          violation?: string | null
        }
        Update: {
          affected_entities?: string[]
          affected_sectors?: string[]
          authority_id?: string | null
          case_number?: string | null
          circumvention_methods?: string[]
          content_type?: Database["public"]["Enums"]["content_type"]
          control_failures?: string[]
          created_at?: string
          detailed_analysis?: string | null
          effective_date?: string | null
          event_date?: string | null
          executive_summary?: string
          headline?: string
          id?: string
          jurisdiction_id?: string | null
          legal_provisions?: string[]
          legal_status?: Database["public"]["Enums"]["legal_status"]
          penalty_amount?: number | null
          penalty_currency?: string | null
          practical_implications?: string | null
          priority?: boolean
          publication_date?: string
          regime_id?: string | null
          retrieved_at?: string | null
          search?: unknown
          slug?: string
          source_facts?: string
          source_publisher?: string | null
          source_title?: string | null
          source_url?: string
          tags?: string[]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          violation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_records_authority_id_fkey"
            columns: ["authority_id"]
            isOneToOne: false
            referencedRelation: "authorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_records_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_records_regime_id_fkey"
            columns: ["regime_id"]
            isOneToOne: false
            referencedRelation: "regimes"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdictions: {
        Row: {
          code: string
          id: string
          name: string
        }
        Insert: {
          code: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      record_categories: {
        Row: {
          category_id: string
          record_id: string
        }
        Insert: {
          category_id: string
          record_id: string
        }
        Update: {
          category_id?: string
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_categories_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "intelligence_records"
            referencedColumns: ["id"]
          },
        ]
      }
      regimes: {
        Row: {
          id: string
          name: string
          slug: string
          target_country: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          target_country?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          target_country?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      content_type:
        | "sanctions_development"
        | "case_law"
        | "enforcement_action"
        | "guidance"
        | "legislation"
        | "circumvention"
      legal_status:
        | "final_judgment"
        | "interim"
        | "ag_opinion"
        | "settlement"
        | "penalty_notice"
        | "conviction"
        | "allegation"
        | "in_force"
        | "announced"
        | "not_applicable"
      verification_status: "verified" | "pending_review" | "unverified"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
      content_type: [
        "sanctions_development",
        "case_law",
        "enforcement_action",
        "guidance",
        "legislation",
        "circumvention",
      ],
      legal_status: [
        "final_judgment",
        "interim",
        "ag_opinion",
        "settlement",
        "penalty_notice",
        "conviction",
        "allegation",
        "in_force",
        "announced",
        "not_applicable",
      ],
      verification_status: ["verified", "pending_review", "unverified"],
    },
  },
} as const
