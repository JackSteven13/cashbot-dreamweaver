
// If the file already exists, let's create an augmentation to it
// This is a supplementary type definition

export interface Transaction {
  id?: string;
  date: string;
  amount?: number;
  type?: string;
  report?: string;
  gain?: number;
}

export interface Referral {
  id: string;
  referred_user_id: string;
  referrer_id: string;
  plan_type: string;
  commission_rate: number;
  status: string;
  created_at: string;
  updated_at?: string;
  active?: boolean;
  commission_earned?: number;
}

export interface UserProfile {
  id?: string;
  full_name?: string;
  email?: string;
  created_at?: string;
  access_code?: string;
  referrer_id?: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  lastFour: string;
  isDefault?: boolean;
}

export interface UserData {
  username: string;
  balance: number;
  subscription: string;
  referrals: Referral[];
  referralLink: string;
  email?: string;
  transactions: Transaction[];
  dailySessionCount?: number;
  registeredAt?: Date;
  lastLogin?: Date;
  isActive?: boolean;
  profile?: UserProfile;
  paymentMethods?: PaymentMethod[];
}
