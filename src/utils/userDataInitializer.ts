
import { UserData } from '@/types/userData';

// Initial empty user data
export const initialUserData: UserData = {
  username: '',
  balance: 0,
  subscription: 'freemium',
  referrals: [],
  referralLink: 'https://cashbot.com?ref=admin',
  transactions: []
};

// Ensure new users start with a zero balance
export const ensureZeroBalanceForNewUser = (isNewUser: boolean, userData: UserData): UserData => {
  if (isNewUser) {
    return {
      ...userData,
      balance: 0,
      transactions: []
    };
  }
  return userData;
};
