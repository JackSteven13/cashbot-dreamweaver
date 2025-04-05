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
        Args: {
          user_id: string
          user_name: string
          user_email: string
        }
        Returns: undefined
      }
      create_user_balance: {
        Args: {
          user_id: string
        }
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
        Args: {
          user_id: string
        }
        Returns: string
      }
      get_referral_code: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      get_user_referral_commission: {
        Args: {
          user_id: string
        }
        Returns: number
      }
      get_user_referrals_count: {
        Args: {
          user_id: string
        }
        Returns: number
      }
      update_user_subscription: {
        Args: {
          user_id: string
          new_subscription: string
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
