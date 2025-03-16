
export interface Transaction {
  date: string;
  gain: number;
  report: string;
}

export interface UserData {
  username: string;
  balance: number;
  subscription: string;
  referrals: any[];
  referralLink: string;
  transactions: Transaction[];
  registeredAt?: Date; // Ajout de la propriété registeredAt comme optionnelle
}
