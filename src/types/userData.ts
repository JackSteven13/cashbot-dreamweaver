
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
  referred_id?: string;
  status?: string;
  date?: string;
  commission?: number;
  email?: string;
}

export interface UserData {
  username?: string;
  email?: string;
  balance: number;
  subscription: string;
  transactions: Transaction[];
  profile: UserProfile;
  referrals: Referral[];
  referralLink?: string;
}
