
/**
 * Interface pour les gains générés lorsque l'utilisateur n'est pas connecté
 */
export interface OfflineGain {
  id: string;
  user_id: string;
  amount: number;
  subscription: string;
  processed: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      offline_gains: {
        Row: OfflineGain;
        Insert: Omit<OfflineGain, 'id' | 'processed' | 'created_at'> & {
          processed?: boolean;
          created_at?: string;
        };
        Update: Partial<OfflineGain>;
      };
    };
  };
}
