
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
    // Également nettoyer le localStorage pour éviter la réutilisation des anciennes données
    try {
      // Nettoyer toutes les statistiques potentiellement présentes pour cet utilisateur
      if (userData.profile?.id) {
        const prefix = `user_stats_${userData.profile.id}`;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (e) {
      console.error('Error cleaning localStorage for new user:', e);
    }

    return {
      ...userData,
      balance: 0,
      transactions: [],
      referrals: [] // S'assurer également qu'il n'y a pas de parrainages hérités
    };
  }
  
  return userData;
};
