
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
      
      // Nettoyer toutes les données spécifiques à cet utilisateur
      if (userId && userId !== 'anonymous') {
        // Nettoyer toutes les clés de localStorage liées aux statistiques pour TOUS les utilisateurs
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('user_stats_') ||
            key.startsWith('currentBalance_') ||
            key.startsWith('lastKnownBalance_') ||
            key.startsWith('lastUpdatedBalance_')
          )) {
            localStorage.removeItem(key);
          }
        }
        
        // Nettoyer également les données de session
        for (const key in sessionStorage) {
          if (key.startsWith('currentBalance_')) {
            sessionStorage.removeItem(key);
          }
        }
        
        // Réinitialiser les clés génériques aussi pour les nouveaux utilisateurs
        localStorage.removeItem('currentBalance');
        localStorage.removeItem('lastKnownBalance');
        localStorage.removeItem('lastUpdatedBalance');
        sessionStorage.removeItem('currentBalance');
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
