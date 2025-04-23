
import { BalanceStorageKeys } from './types';

export const getUserSpecificKeys = (userId: string): BalanceStorageKeys => ({
  currentBalance: `currentBalance_${userId}`,
  lastKnownBalance: `lastKnownBalance_${userId}`,
  lastUpdatedBalance: `lastUpdatedBalance_${userId}`,
  sessionCurrentBalance: `currentBalance_${userId}`,
  highestBalance: `highest_balance_${userId}`
});

export const persistBalance = (balance: number, userId?: string): void => {
  try {
    if (!userId) {
      console.error("Impossible de persister le solde sans ID utilisateur");
      return;
    }
    
    console.log(`Persistance du solde ${balance}€ pour utilisateur ${userId}`);
    
    const keys = getUserSpecificKeys(userId);
    
    // Persister le solde avec des clés spécifiques à l'utilisateur
    localStorage.setItem(keys.currentBalance, balance.toString());
    localStorage.setItem(keys.lastKnownBalance, balance.toString());
    localStorage.setItem(keys.lastUpdatedBalance, balance.toString());
    localStorage.setItem(keys.highestBalance, Math.max(
      parseFloat(localStorage.getItem(keys.highestBalance) || '0'),
      balance
    ).toString());
    sessionStorage.setItem(keys.sessionCurrentBalance, balance.toString());
    
    // Ne pas persister dans les clés globales pour éviter les collisions entre utilisateurs
    // Retirer les anciennes clés globales si elles existent
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('lastKnownBalance');
    localStorage.removeItem('lastUpdatedBalance');
    sessionStorage.removeItem('currentBalance');
  } catch (e) {
    console.error("Failed to persist balance:", e);
  }
};

export const getPersistedBalance = (userId?: string): number => {
  try {
    if (!userId) {
      console.error("Impossible de récupérer le solde sans ID utilisateur");
      return 0;
    }
    
    const keys = getUserSpecificKeys(userId);
    
    // Collecter toutes les sources spécifiques à l'utilisateur
    const sources = [
      localStorage.getItem(keys.currentBalance),
      localStorage.getItem(keys.lastKnownBalance),
      localStorage.getItem(keys.lastUpdatedBalance),
      localStorage.getItem(keys.highestBalance),
      sessionStorage.getItem(keys.sessionCurrentBalance)
      // Ne pas récupérer les clés globales pour éviter les collisions entre utilisateurs
    ];

    const validBalances = sources
      .map(val => val ? parseFloat(val) : 0)
      .filter(num => !isNaN(num) && num > 0);

    // Si on trouve des valeurs valides, utiliser la plus élevée
    if (validBalances.length > 0) {
      const maxBalance = Math.max(...validBalances);
      console.log(`Solde récupéré pour ${userId}: ${maxBalance}€`);
      return maxBalance;
    }
    
    console.log(`Aucun solde trouvé pour ${userId}, retour à 0€`);
    return 0;
  } catch (e) {
    console.error("Failed to get persisted balance:", e);
    return 0;
  }
};

// Fonction pour nettoyer complètement les données d'un autre utilisateur
export const cleanOtherUserData = (currentUserId: string): void => {
  try {
    console.log("Nettoyage des données d'autres utilisateurs, utilisateur actuel:", currentUserId);
    
    // Parcourir toutes les clés de localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Détecter les clés spécifiques à un utilisateur (y compris les noms d'utilisateurs)
      if (key.includes('_') && key !== `currentBalance_${currentUserId}` && 
          key !== `lastKnownBalance_${currentUserId}` &&
          key !== `lastUpdatedBalance_${currentUserId}` &&
          key !== `highest_balance_${currentUserId}` &&
          key !== `lastKnownUsername_${currentUserId}` && // Ajout de la clé de nom spécifique
          key !== `subscription_${currentUserId}`) { // Ajout de la clé d'abonnement
        
        // Ne supprimer que les clés liées aux données utilisateur d'autres utilisateurs
        if (key.startsWith('currentBalance_') || 
            key.startsWith('lastKnownBalance_') || 
            key.startsWith('lastUpdatedBalance_') ||
            key.startsWith('highest_balance_') ||
            key.startsWith('lastKnownUsername_') ||  // Ajout de la clé de nom
            key.startsWith('subscription_')) {       // Ajout de la clé d'abonnement
          console.log("Suppression clé d'un autre utilisateur:", key);
          localStorage.removeItem(key);
        }
      }
    }
    
    // Nettoyer aussi les clés globales pour s'assurer qu'il n'y a pas de contamination
    const globalKeysToClean = [
      'currentBalance',
      'lastKnownBalance',
      'lastUpdatedBalance',
      'lastKnownUsername', // Ajout explicite
      'subscription'       // Ajout explicite
    ];
    
    globalKeysToClean.forEach(key => {
      localStorage.removeItem(key);
      if (key === 'currentBalance') {
        sessionStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error("Erreur lors du nettoyage des données:", e);
  }
};
