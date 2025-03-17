
export interface Transaction {
  date: string;
  gain: number;
  report: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  plan_type: string;
  status: string;
  commission_rate: number;
  created_at: string;
  updated_at: string;
}

export interface UserData {
  username: string;
  balance: number;
  subscription: string;
  referrals: Referral[];
  referralLink: string;
  transactions: Transaction[];
  registeredAt?: Date;
}
