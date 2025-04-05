
// Custom types for the referral_codes table since it's not in the generated types

export interface ReferralCode {
  id: string;
  code: string;
  created_at: string;
  is_active: boolean;
  owner_id: string | null;
  created_by_admin: boolean;
}

export type ReferralCodeInsert = Omit<ReferralCode, 'id' | 'created_at'> & { 
  id?: string; 
  created_at?: string;
};

// For use in components that need access to this custom type
export const REFERRAL_CODES_TABLE = 'referral_codes';
