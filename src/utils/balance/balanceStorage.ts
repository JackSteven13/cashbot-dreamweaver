
import { StorageKeys } from './types';

export const getStorageKeys = (userId: string | null): StorageKeys => ({
  currentBalance: userId ? `currentBalance_${userId}` : 'currentBalance',
  lastKnownBalance: userId ? `lastKnownBalance_${userId}` : 'lastKnownBalance',
  highestBalance: userId ? `highest_balance_${userId}` : 'highest_balance',
  dailyGains: userId ? `dailyGains_${userId}` : 'dailyGains'
});

export const persistBalance = (balance: number, userId: string | null): void => {
  try {
    const keys = getStorageKeys(userId);
    localStorage.setItem(keys.currentBalance, balance.toString());
    localStorage.setItem(keys.lastKnownBalance, balance.toString());
    sessionStorage.setItem(keys.currentBalance, balance.toString());
  } catch (e) {
    console.error('Failed to persist balance:', e);
  }
};

export const getPersistedBalance = (userId: string | null): number => {
  try {
    const keys = getStorageKeys(userId);
    const sources = [
      localStorage.getItem(keys.currentBalance),
      localStorage.getItem(keys.lastKnownBalance),
      sessionStorage.getItem(keys.currentBalance)
    ];
    
    const validBalances = sources
      .map(val => val ? parseFloat(val) : NaN)
      .filter(val => !isNaN(val));
      
    return validBalances.length > 0 ? Math.max(...validBalances) : 0;
  } catch (e) {
    console.error('Failed to get persisted balance:', e);
    return 0;
  }
};

// Fonction pour nettoyer les données d'autres utilisateurs
export const cleanOtherUserData = (currentUserId: string | null): void => {
  try {
    // Récupérer toutes les clés du localStorage
    const allKeys = Object.keys(localStorage);
    
    // Filtrer les clés qui appartiennent à d'autres utilisateurs
    allKeys.forEach(key => {
      // Vérifier si c'est une clé spécifique à un utilisateur (contient un ID qui n'est pas celui de l'utilisateur actuel)
      if (key.includes('_') && key.split('_').length > 1) {
        // Extraire l'ID utilisateur de la clé
        const keyParts = key.split('_');
        const keyUserId = keyParts[keyParts.length - 1];
        
        // Si cette clé est spécifique à un utilisateur et pas pour l'utilisateur actuel, la supprimer
        if (keyUserId !== currentUserId && keyUserId.length > 5) {
          console.log(`Removing data from other user: ${key}`);
          localStorage.removeItem(key);
        }
      }
    });
    
    console.log('Cleaned other user data from localStorage');
  } catch (e) {
    console.error('Failed to clean other user data:', e);
  }
};

// Fonction pour obtenir toutes les clés spécifiques à un utilisateur
export const getUserSpecificKeys = (userId: string | null): string[] => {
  if (!userId) return [];
  
  try {
    // Récupérer toutes les clés du localStorage
    const allKeys = Object.keys(localStorage);
    
    // Filtrer les clés qui appartiennent à l'utilisateur spécifié
    return allKeys.filter(key => 
      key.endsWith(`_${userId}`) || 
      key.includes(`_${userId}_`)
    );
  } catch (e) {
    console.error('Failed to get user-specific keys:', e);
    return [];
  }
};
