
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
  referred_id?: string; // Ajout du referred_id à la place de referred_user_id
  status?: string;
  date?: string;
  commission?: number;
  email?: string;
  active?: boolean; // Ajout du champ active
  created_at?: string; // Ajout du champ created_at
}

export interface UserData {
  id?: string; // Ajout d'un ID principal
  username?: string;
  email?: string;
  balance: number;
  subscription: string;
  transactions: Transaction[];
  profile: UserProfile;
  referrals: Referral[];
  referralLink?: string;
  registeredAt?: Date; // Ajout de la date d'inscription
  lastLogin?: Date; // Ajout de la date de dernière connexion
}
