
// Définition des types liés aux données utilisateur

export interface Transaction {
  id: string;
  date: string;
  gain: number;
  report: string;
  created_at?: string;
  user_id?: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  commission_rate: number;
  status: string;
  plan_type: string;
  created_at?: string;
  date?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  avatar_url?: string;
  created_at?: string;
  email?: string;
  full_name?: string;
  referrer_id?: string;
  access_code?: string;
}

export interface UserData {
  id: string;
  subscription: 'freemium' | 'starter' | 'pro' | 'elite';
  balance: number;
  transactions: Transaction[];
  referrals: Referral[];
  referralLink: string;
  profile?: Profile;
  username?: string;
  dailySessionCount: number;
  pro_trial_used?: boolean;
  updated_at?: string;
  isBotActive?: boolean;
}
