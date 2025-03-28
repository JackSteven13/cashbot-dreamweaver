
import { UserData } from '@/types/userData';

/**
 * Ensures that new users start with a zero balance and empty transactions
 * This prevents showing incorrect data for new users
 */
export const ensureZeroBalanceForNewUser = (isNewUser: boolean, userData: UserData): UserData => {
  if (!userData) {
    return {} as UserData;
  }
  
  // Pour les nouveaux utilisateurs, on force le solde à 0 et on supprime toutes les transactions
  if (isNewUser) {
    return {
      ...userData,
      balance: 0,
      transactions: []
    };
  }
  
  return userData;
};
