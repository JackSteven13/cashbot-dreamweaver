
export interface Transaction {
  date: string;
  amount: number;
  type: string;
  report: string;
  gain?: number; // Keep the original 'gain' for backward compatibility
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
  username?: string; // Add this for display purposes
  joinDate?: string; // Add this for display purposes
  active?: boolean; // Add this for status checking
}

export interface UserData {
  username: string;
  balance: number;
  subscription: string;
  referrals: Referral[];
  referralLink: string;
  transactions: Transaction[];
  registeredAt?: Date;
  email?: string; // Add email property
  paymentMethods?: Array<{
    type: string;
    lastFour: string;
  }>;
  totalEarnings?: number; // Add totalEarnings property
}
