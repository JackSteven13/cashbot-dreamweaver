
/**
 * BalanceManager: Gestionnaire centralisé du solde utilisateur
 * Assure la cohérence du solde entre les différents composants
 */

import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { BalanceManagerInstance } from '@/types/balanceManager';

let currentBalance: number = 0;
let dailyGains: number = 0;
let highestBalance: number = 0;
let userId: string | null = null;

// Pour suivre les changements de solde
const watchers: ((newBalance: number) => void)[] = [];

// Récupérer le solde du stockage local
const loadBalanceFromStorage = (): number => {
  const storedBalance = localStorage.getItem('current_balance');
  if (!storedBalance) return 0;
  
  const parsed = parseFloat(storedBalance);
  return isNaN(parsed) ? 0 : parsed;
};

// Stocker le solde local
const saveBalanceToStorage = (balance: number): void => {
  localStorage.setItem('current_balance', balance.toString());
};

// Récupérer les gains quotidiens du stockage local
const loadDailyGainsFromStorage = (): number => {
  if (!userId) return 0;
  
  const storedGains = localStorage.getItem(`daily_gains_${userId}`);
  if (!storedGains) return 0;
  
  const parsed = parseFloat(storedGains);
  return isNaN(parsed) ? 0 : parsed;
};

// Stocker les gains quotidiens
const saveDailyGainsToStorage = (gains: number): void => {
  if (!userId) return;
  localStorage.setItem(`daily_gains_${userId}`, gains.toString());
  
  // Si les gains dépassent la limite quotidienne, marquer comme limite atteinte
  const subscription = localStorage.getItem(`subscription_${userId}`) || 'freemium';
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  if (gains >= dailyLimit) {
    localStorage.setItem(`daily_limit_reached_${userId}`, 'true');
    
    // Déclencher un événement
    window.dispatchEvent(new CustomEvent('daily-limit:reached', {
      detail: {
        subscription,
        limit: dailyLimit,
        currentGains: gains,
        userId
      }
    }));
  }
};

// Récupérer le solde le plus élevé
const loadHighestBalanceFromStorage = (): number => {
  if (!userId) return 0;
  
  const storedHighest = localStorage.getItem(`highest_balance_${userId}`);
  if (!storedHighest) return 0;
  
  const parsed = parseFloat(storedHighest);
  return isNaN(parsed) ? 0 : parsed;
};

// Stocker le solde le plus élevé
const saveHighestBalanceToStorage = (balance: number): void => {
  if (!userId) return;
  localStorage.setItem(`highest_balance_${userId}`, balance.toString());
};

// Vérifier si un nouveau jour a commencé
const checkForNewDay = (): boolean => {
  if (!userId) return false;
  
  const lastDate = localStorage.getItem(`last_gains_date_${userId}`);
  const today = new Date().toDateString();
  
  if (lastDate !== today) {
    localStorage.setItem(`last_gains_date_${userId}`, today);
    return true;
  }
  
  return false;
};

// Réinitialiser les gains quotidiens si c'est un nouveau jour
const resetDailyGainsIfNewDay = (): void => {
  if (!userId) return;
  
  if (checkForNewDay()) {
    dailyGains = 0;
    saveDailyGainsToStorage(0);
    localStorage.removeItem(`daily_limit_reached_${userId}`);
    localStorage.removeItem(`freemium_daily_limit_reached_${userId}`);
    console.log("✓ Nouveau jour détecté, gains quotidiens réinitialisés");
  }
};

// Instance du gestionnaire de solde
const balanceManager: BalanceManagerInstance = {
  // Méthodes principales de gestion du solde
  getCurrentBalance: (): number => {
    // Si le solde n'a pas été initialisé, le charger depuis le stockage
    if (currentBalance === 0) {
      currentBalance = loadBalanceFromStorage();
    }
    return currentBalance;
  },
  
  // Synchroniser de force le solde (par exemple depuis la base de données)
  forceBalanceSync: (newBalance: number, newUserId?: string): void => {
    if (typeof newBalance !== 'number' || isNaN(newBalance)) {
      console.error("Tentative de synchronisation avec un solde invalide:", newBalance);
      return;
    }
    
    // Mettre à jour l'ID utilisateur si fourni
    if (newUserId) {
      userId = newUserId;
    }
    
    // Si c'est un nouveau jour, réinitialiser les gains quotidiens
    resetDailyGainsIfNewDay();
    
    // Mettre à jour le solde et notifier les observateurs
    const oldBalance = currentBalance;
    currentBalance = Math.max(0, newBalance);
    saveBalanceToStorage(currentBalance);
    
    // Mettre à jour le solde le plus élevé si nécessaire
    if (currentBalance > highestBalance) {
      highestBalance = currentBalance;
      saveHighestBalanceToStorage(highestBalance);
    }
    
    // Notifier les observateurs
    watchers.forEach(callback => callback(currentBalance));
    
    // Si le changement est significatif, émettre un événement
    if (Math.abs(currentBalance - oldBalance) > 0.01) {
      window.dispatchEvent(new CustomEvent('balance:changed', {
        detail: {
          oldBalance,
          newBalance: currentBalance,
          userId
        }
      }));
    }
  },
  
  // Mettre à jour le solde (ajouter ou soustraire un montant)
  updateBalance: (amount: number): boolean => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.error("Tentative de mise à jour avec un montant invalide:", amount);
      return false;
    }
    
    const oldBalance = currentBalance;
    currentBalance = Math.max(0, parseFloat((currentBalance + amount).toFixed(2)));
    
    // Sauvegarder et notifier
    saveBalanceToStorage(currentBalance);
    
    // Mettre à jour le solde le plus élevé si nécessaire
    if (currentBalance > highestBalance) {
      highestBalance = currentBalance;
      saveHighestBalanceToStorage(highestBalance);
    }
    
    // Notifier les observateurs
    watchers.forEach(callback => callback(currentBalance));
    
    return true;
  },
  
  // Méthodes de gestion des gains quotidiens
  getDailyGains: (): number => {
    // Si les gains n'ont pas été initialisés, les charger depuis le stockage
    if (dailyGains === 0) {
      dailyGains = loadDailyGainsFromStorage();
    }
    
    // Vérifier si c'est un nouveau jour
    resetDailyGainsIfNewDay();
    
    return dailyGains;
  },
  
  setDailyGains: (amount: number): void => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.error("Tentative de définition de gains quotidiens invalides:", amount);
      return;
    }
    
    dailyGains = Math.max(0, parseFloat(amount.toFixed(2)));
    saveDailyGainsToStorage(dailyGains);
  },
  
  addDailyGain: (amount: number): boolean => {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      console.error("Tentative d'ajout d'un gain quotidien invalide:", amount);
      return false;
    }
    
    // S'assurer que les gains sont chargés
    if (dailyGains === 0) {
      dailyGains = loadDailyGainsFromStorage();
    }
    
    // Vérifier si c'est un nouveau jour
    resetDailyGainsIfNewDay();
    
    // Ajouter le gain
    dailyGains = parseFloat((dailyGains + amount).toFixed(2));
    saveDailyGainsToStorage(dailyGains);
    
    return true;
  },
  
  syncDailyGainsFromTransactions: (amount: number): void => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.error("Tentative de synchronisation avec des gains invalides:", amount);
      return;
    }
    
    dailyGains = Math.max(0, parseFloat(amount.toFixed(2)));
    saveDailyGainsToStorage(dailyGains);
  },
  
  // Méthodes de suivi du solde maximum
  getHighestBalance: (): number => {
    if (highestBalance === 0) {
      highestBalance = loadHighestBalanceFromStorage();
    }
    return highestBalance;
  },
  
  updateHighestBalance: (balance: number): void => {
    if (typeof balance !== 'number' || isNaN(balance) || balance <= 0) {
      console.error("Tentative de mise à jour du solde maximum avec une valeur invalide:", balance);
      return;
    }
    
    highestBalance = Math.max(highestBalance, balance);
    saveHighestBalanceToStorage(highestBalance);
  },
  
  // Gestion de l'utilisateur
  setUserId: (newUserId: string): void => {
    userId = newUserId;
    
    // Recharger les données pour le nouvel utilisateur
    currentBalance = loadBalanceFromStorage();
    dailyGains = loadDailyGainsFromStorage();
    highestBalance = loadHighestBalanceFromStorage();
    
    // Vérifier si c'est un nouveau jour
    resetDailyGainsIfNewDay();
  },
  
  getUserId: (): string | null => {
    return userId;
  },
  
  // Abonnement aux changements de solde
  addWatcher: (callback: (newBalance: number) => void): (() => void) => {
    watchers.push(callback);
    
    // Retourner une fonction pour se désabonner
    return () => {
      const index = watchers.indexOf(callback);
      if (index !== -1) {
        watchers.splice(index, 1);
      }
    };
  },
  
  // Vérification des limites quotidiennes
  isDailyLimitReached: (subscription: string): boolean => {
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    return dailyGains >= dailyLimit;
  },
  
  getRemainingDailyAllowance: (subscription: string): number => {
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    return Math.max(0, parseFloat((dailyLimit - dailyGains).toFixed(2)));
  },
  
  validateGainAgainstDailyLimit: (amount: number, subscription: string): { allowed: boolean; adjustedAmount: number } => {
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Si la limite est déjà atteinte
    if (dailyGains >= dailyLimit) {
      return {
        allowed: false,
        adjustedAmount: 0
      };
    }
    
    // Si le gain ferait dépasser la limite
    if (dailyGains + amount > dailyLimit) {
      const adjustedAmount = Math.max(0, parseFloat((dailyLimit - dailyGains).toFixed(2)));
      return {
        allowed: true,
        adjustedAmount
      };
    }
    
    // Si tout est en ordre
    return {
      allowed: true,
      adjustedAmount: amount
    };
  },
  
  // Méthodes de réinitialisation pour le débogage
  resetBalance: (): boolean => {
    currentBalance = 0;
    saveBalanceToStorage(0);
    watchers.forEach(callback => callback(0));
    return true;
  },
  
  resetDailyGains: (): void => {
    dailyGains = 0;
    if (userId) {
      saveDailyGainsToStorage(0);
      localStorage.removeItem(`daily_limit_reached_${userId}`);
      localStorage.removeItem(`freemium_daily_limit_reached_${userId}`);
    }
  }
};

// Initialiser lors de l'importation
const currentUserId = localStorage.getItem('current_user_id');
if (currentUserId) {
  balanceManager.setUserId(currentUserId);
}

export default balanceManager;
