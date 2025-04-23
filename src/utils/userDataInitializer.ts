
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
    // Nettoyer le localStorage pour éviter la réutilisation des anciennes données
    try {
      const userId = userData?.profile?.id || 'anonymous';
      
      console.log("NETTOYAGE COMPLET pour nouvel utilisateur:", userId);
      
      // NETTOYAGE RADICAL - Supprimer TOUTES les données de solde dans localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('user_stats_') ||
          key.startsWith('currentBalance_') ||
          key.startsWith('lastKnownBalance_') ||
          key.startsWith('lastUpdatedBalance_') ||
          key.startsWith('highest_balance_') ||
          key === 'currentBalance' ||
          key === 'lastKnownBalance' ||
          key === 'lastUpdatedBalance'
        )) {
          console.log("Suppression clé:", key);
          localStorage.removeItem(key);
        }
      }
      
      // Nettoyer également les données de session
      for (const key in sessionStorage) {
        if (key.startsWith('currentBalance_') || key === 'currentBalance') {
          sessionStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error('Error cleaning localStorage for new user:', e);
    }

    console.log("Données utilisateur réinitialisées pour nouvel utilisateur");
    
    return {
      ...userData,
      balance: 0,
      transactions: [],
      referrals: [] // S'assurer également qu'il n'y a pas de parrainages hérités
    };
  }
  
  return userData;
};
