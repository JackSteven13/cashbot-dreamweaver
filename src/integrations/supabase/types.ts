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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_code: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          referrer_id: string | null
        }
        Insert: {
          access_code?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          referrer_id?: string | null
        }
        Update: {
          access_code?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          referrer_id?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          created_by_admin: boolean
          id: string
          is_active: boolean
          owner_id: string | null
          usage_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by_admin?: boolean
          id?: string
          is_active?: boolean
          owner_id?: string | null
          usage_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by_admin?: boolean
          id?: string
          is_active?: boolean
          owner_id?: string | null
          usage_count?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          plan_type: string
          referred_user_id: string
          referrer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          id?: string
          plan_type: string
          referred_user_id: string
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          plan_type?: string
          referred_user_id?: string
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          date: string
          gain: number
          id: string
          report: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          gain: number
          id?: string
          report: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          gain?: number
          id?: string
          report?: string
          user_id?: string
        }
        Relationships: []
      }
      user_balances: {
        Row: {
          balance: number
          daily_session_count: number
          id: string
          pro_trial_used: boolean | null
          subscription: string
          updated_at: string
        }
        Insert: {
          balance?: number
          daily_session_count?: number
          id: string
          pro_trial_used?: boolean | null
          subscription?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          daily_session_count?: number
          id?: string
          pro_trial_used?: boolean | null
          subscription?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_profile: {
        Args: { user_id: string; user_name: string; user_email: string }
        Returns: undefined
      }
      create_user_balance: {
        Args: { user_id: string }
        Returns: {
          balance: number
          daily_session_count: number
          id: string
          pro_trial_used: boolean | null
          subscription: string
          updated_at: string
        }[]
      }
      generate_access_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_subscription: {
        Args: { user_id: string }
        Returns: string
      }
      get_referral_code: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_referral_commission: {
        Args: { user_id: string }
        Returns: number
      }
      get_user_referrals_count: {
        Args: { user_id: string }
        Returns: number
      }
      update_user_subscription: {
        Args: { user_id: string; new_subscription: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
