
export interface UserProfile {
  id?: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
  [key: string]: any;
}

export interface Transaction {
  id?: string;
  date: string;
  gain?: number;
  amount?: number;
  report?: string;
  type?: string;
}

export interface Referral {
  id?: string;
  referrer_id?: string;
  referred_id?: string; // Make sure this is the correct property name (not referred_user_id)
  status?: string;
  date?: string;
  commission?: number;
  email?: string;
  active?: boolean;
  created_at?: string;
}

export interface UserData {
  id?: string;
  username?: string;
  email?: string;
  balance: number;
  subscription: string;
  transactions: Transaction[];
  profile: UserProfile; // Required field
  referrals: Referral[];
  referralLink?: string;
  registeredAt?: Date;
  lastLogin?: Date;
  // Add dailySessionCount here since we're using it in the app
  dailySessionCount?: number;
}
