
import { UserData } from '@/types/userData';

/**
 * Default initial user data for new users
 */
export const initialUserData: UserData = {
  username: '',
  balance: 0,
  subscription: 'freemium',
  transactions: [],
  profile: {}, // Add the required profile property
  referrals: [],
  referralLink: '',
};

/**
 * Ensures that new users start with a zero balance and empty transactions
 * This prevents showing incorrect data for new users
 */
export const ensureZeroBalanceForNewUser = (isNewUser: boolean, userData: UserData): UserData => {
  if (!userData) {
    return initialUserData;
  }
  
  // Pour les nouveaux utilisateurs, on force le solde à 0 et on supprime toutes les transactions
  if (isNewUser) {
    return {
      ...userData,
      balance: 0,
      transactions: [],
      referrals: [] // S'assurer également qu'il n'y a pas de parrainages hérités
    };
  }
  
  return userData;
};
