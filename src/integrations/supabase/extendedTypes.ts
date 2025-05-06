
import { Database } from './types';

// Extended database types to include the new user_connections table
export interface ExtendedDatabase extends Database {
  public: {
    Tables: Database['public']['Tables'] & {
      user_connections: {
        Row: {
          id: string;
          user_id: string;
          connected_at: string;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
          success: boolean;
          error_message: string | null;
          email: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          connected_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          success?: boolean;
          error_message?: string | null;
          email?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          connected_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          success?: boolean;
          error_message?: string | null;
          email?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_connections_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Database['public']['Views'];
    Functions: Database['public']['Functions'];
    Enums: Database['public']['Enums'];
    CompositeTypes: Database['public']['CompositeTypes'];
  };
};
