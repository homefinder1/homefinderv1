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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      annonser: {
        Row: {
          antal_rum: number | null
          beskrivning: string | null
          hyra: string | null
          id: string
          kalla: string
          kontakt_email: string
          kontakt_namn: string | null
          kontakt_telefon: string | null
          omrade: string | null
          skapad_datum: string
          status: Database["public"]["Enums"]["annons_status"]
          titel: string
          user_id: string | null
        }
        Insert: {
          antal_rum?: number | null
          beskrivning?: string | null
          hyra?: string | null
          id?: string
          kalla?: string
          kontakt_email: string
          kontakt_namn?: string | null
          kontakt_telefon?: string | null
          omrade?: string | null
          skapad_datum?: string
          status?: Database["public"]["Enums"]["annons_status"]
          titel: string
          user_id?: string | null
        }
        Update: {
          antal_rum?: number | null
          beskrivning?: string | null
          hyra?: string | null
          id?: string
          kalla?: string
          kontakt_email?: string
          kontakt_namn?: string | null
          kontakt_telefon?: string | null
          omrade?: string | null
          skapad_datum?: string
          status?: Database["public"]["Enums"]["annons_status"]
          titel?: string
          user_id?: string | null
        }
        Relationships: []
      }
      geocode_cache: {
        Row: {
          created_at: string
          found: boolean
          lat: number | null
          lon: number | null
          query: string
        }
        Insert: {
          created_at?: string
          found?: boolean
          lat?: number | null
          lon?: number | null
          query: string
        }
        Update: {
          created_at?: string
          found?: boolean
          lat?: number | null
          lon?: number | null
          query?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          efternamn: string
          fornamn: string
          id: string
          skapad_datum: string
          telefon: string
          uppdaterad_datum: string
        }
        Insert: {
          efternamn?: string
          fornamn?: string
          id: string
          skapad_datum?: string
          telefon?: string
          uppdaterad_datum?: string
        }
        Update: {
          efternamn?: string
          fornamn?: string
          id?: string
          skapad_datum?: string
          telefon?: string
          uppdaterad_datum?: string
        }
        Relationships: []
      }
      scraped_annonser: {
        Row: {
          antal_rum: string | null
          hyra: string | null
          hyra_num: number | null
          id: string
          kalla: string
          ledig: string | null
          ledig_datum: string | null
          omrade: string | null
          rum_num: number | null
          skapad_datum: string
          storlek: string | null
          storlek_num: number | null
          titel: string
          url: string
        }
        Insert: {
          antal_rum?: string | null
          hyra?: string | null
          hyra_num?: number | null
          id?: string
          kalla: string
          ledig?: string | null
          ledig_datum?: string | null
          omrade?: string | null
          rum_num?: number | null
          skapad_datum?: string
          storlek?: string | null
          storlek_num?: number | null
          titel: string
          url: string
        }
        Update: {
          antal_rum?: string | null
          hyra?: string | null
          hyra_num?: number | null
          id?: string
          kalla?: string
          ledig?: string | null
          ledig_datum?: string | null
          omrade?: string | null
          rum_num?: number | null
          skapad_datum?: string
          storlek?: string | null
          storlek_num?: number | null
          titel?: string
          url?: string
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
      alla_annonser: {
        Row: {
          antal_rum: string | null
          hyra: string | null
          hyra_num: number | null
          id: string | null
          kalla: string | null
          ledig: string | null
          ledig_datum: string | null
          omrade: string | null
          rum_num: number | null
          skapad_datum: string | null
          storlek: string | null
          storlek_num: number | null
          titel: string | null
          typ: string | null
          url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      annons_status: "vantande" | "godkand" | "avvisad"
      app_role: "admin" | "moderator" | "user"
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
      annons_status: ["vantande", "godkand", "avvisad"],
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
