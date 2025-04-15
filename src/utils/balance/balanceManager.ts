
/**
 * Gestionnaire central du solde utilisateur pour éviter les désynchronisations
 * et assurer la persistance même en cas de problèmes réseau
 */

// Variables de stockage local
let currentBalance: number | null = null;
let highestBalance: number | null = null;
let lastUpdateTimestamp: number = 0;
let dailyGains: number = 0;

// Initialisation à partir du stockage local si disponible
const initialize = (initialBalance?: number) => {
  try {
    if (initialBalance !== undefined && !isNaN(initialBalance)) {
      currentBalance = initialBalance;
    } else {
      const storedBalance = localStorage.getItem('currentBalance');
      if (storedBalance) {
        currentBalance = parseFloat(storedBalance);
      }
    }
    
    const storedHighestBalance = localStorage.getItem('highestBalance');
    if (storedHighestBalance) {
      highestBalance = parseFloat(storedHighestBalance);
    } else if (currentBalance !== null) {
      highestBalance = currentBalance;
    }
    
    const storedTimestamp = localStorage.getItem('lastBalanceUpdateTime');
    if (storedTimestamp) {
      lastUpdateTimestamp = new Date(storedTimestamp).getTime();
    }
    
    const storedDailyGains = localStorage.getItem('dailyGains');
    if (storedDailyGains) {
      dailyGains = parseFloat(storedDailyGains);
    }
    
    console.log(`[balanceManager] Initialized - Current: ${currentBalance}, Highest: ${highestBalance}, Daily Gains: ${dailyGains}`);
  } catch (error) {
    console.error('Error initializing balance manager:', error);
  }
};

// Initialiser au chargement
initialize();

/**
 * Met à jour le solde actuel et conserve l'historique
 * @param gain Montant à ajouter au solde (positif ou négatif)
 */
export const updateBalance = (gain: number): number => {
  try {
    // Si pas encore initialisé, essayer à nouveau
    if (currentBalance === null) {
      initialize();
      
      // Si toujours null, utiliser 0 comme valeur par défaut
      if (currentBalance === null) {
        currentBalance = 0;
      }
    }
    
    // Calculer le nouveau solde
    const newBalance = currentBalance + gain;
    
    // Mettre à jour le solde courant
    currentBalance = newBalance;
    
    // Mettre à jour le solde maximum si nécessaire
    if (highestBalance === null || newBalance > highestBalance) {
      highestBalance = newBalance;
    }
    
    // Mettre à jour le timestamp
    lastUpdateTimestamp = Date.now();
    
    // Persister dans le stockage local
    localStorage.setItem('currentBalance', String(newBalance));
    localStorage.setItem('highestBalance', String(highestBalance));
    localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
    
    console.log(`[balanceManager] Balance updated: ${currentBalance - gain} + ${gain} = ${currentBalance}`);
    
    return newBalance;
  } catch (error) {
    console.error('Error updating balance:', error);
    return currentBalance || 0;
  }
};

/**
 * Réinitialise le solde après un retrait
 */
export const resetBalance = (): void => {
  try {
    currentBalance = 0;
    localStorage.setItem('currentBalance', '0');
    localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
    
    console.log('[balanceManager] Balance reset to 0');
  } catch (error) {
    console.error('Error resetting balance:', error);
  }
};

/**
 * Réinitialise les compteurs quotidiens mais préserve le solde
 */
export const resetDailyCounters = (): void => {
  try {
    localStorage.setItem('dailySessionCount', '0');
    localStorage.setItem('lastDailyReset', new Date().toISOString());
    localStorage.setItem('dailyGains', '0');
    dailyGains = 0;
    
    console.log('[balanceManager] Daily counters reset');
    
    // Trigger l'événement de réinitialisation pour les autres composants
    window.dispatchEvent(new CustomEvent('dailyGains:reset'));
  } catch (error) {
    console.error('Error resetting daily counters:', error);
  }
};

/**
 * Obtient le solde actuel
 */
export const getCurrentBalance = (): number => {
  if (currentBalance === null) {
    initialize();
  }
  return currentBalance || 0;
};

/**
 * Obtient le solde le plus élevé
 */
export const getHighestBalance = (): number => {
  if (highestBalance === null) {
    initialize();
  }
  return highestBalance || 0;
};

/**
 * Force la synchronisation du solde avec une valeur spécifique
 * Utilisé généralement quand le serveur fournit une valeur officielle
 */
export const forceBalanceSync = (serverBalance: number): void => {
  try {
    // Vérifier que le nouveau solde est valide
    if (typeof serverBalance !== 'number' || isNaN(serverBalance)) {
      console.error('[balanceManager] Invalid balance value for sync:', serverBalance);
      return;
    }
    
    // Mettre à jour avec la valeur du serveur seulement si elle est supérieure
    if (highestBalance === null || serverBalance > highestBalance) {
      currentBalance = serverBalance;
      highestBalance = serverBalance;
      
      localStorage.setItem('currentBalance', String(serverBalance));
      localStorage.setItem('highestBalance', String(serverBalance));
      localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
      
      console.log(`[balanceManager] Balance force synced to ${serverBalance}`);
    } else {
      console.log(`[balanceManager] Server balance (${serverBalance}) lower than highest (${highestBalance}), keeping highest`);
    }
  } catch (error) {
    console.error('Error during force balance sync:', error);
  }
};

/**
 * Ajoute un gain quotidien au total
 */
export const addDailyGain = (gain: number): number => {
  try {
    dailyGains += gain;
    localStorage.setItem('dailyGains', String(dailyGains));
    
    // Déclencher un événement pour que les autres composants sachent que les gains quotidiens ont changé
    window.dispatchEvent(new CustomEvent('dailyGains:updated', {
      detail: { gains: dailyGains }
    }));
    
    return dailyGains;
  } catch (error) {
    console.error('Error adding daily gain:', error);
    return dailyGains;
  }
};

/**
 * Récupère le total des gains quotidiens
 */
export const getDailyGains = (): number => {
  try {
    const storedDailyGains = localStorage.getItem('dailyGains');
    if (storedDailyGains) {
      dailyGains = parseFloat(storedDailyGains);
    }
    return dailyGains;
  } catch (error) {
    console.error('Error getting daily gains:', error);
    return 0;
  }
};

/**
 * Force une mise à jour du solde sans affecter l'historique
 */
export const forceUpdate = (newBalance: number): void => {
  currentBalance = newBalance;
  localStorage.setItem('currentBalance', String(newBalance));
  localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
  console.log(`[balanceManager] Balance force updated to ${newBalance}`);
};

/**
 * Ajoute une transaction pour l'utilisateur
 */
export const addTransaction = async (userId: string, gain: number, report: string) => {
  try {
    console.log(`[balanceManager] Adding transaction for user ${userId}: ${gain}€ - ${report}`);
    
    // Dans une véritable implémentation, cette fonction enverrait la transaction
    // à un serveur backend. Pour cette démo, nous simulons juste un délai.
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // À ce stade, nous supposons que la transaction a été ajoutée avec succès
    addDailyGain(gain);
    
    return {
      success: true,
      transaction: {
        date: new Date().toISOString(),
        gain,
        report
      }
    };
  } catch (error) {
    console.error('Error adding transaction:', error);
    return {
      success: false,
      transaction: null
    };
  }
};

/**
 * Synchronise le solde avec la base de données
 */
export const syncWithDatabase = async (): Promise<boolean> => {
  try {
    // Dans une véritable implémentation, cette fonction synchroniserait
    // le solde avec une base de données. Pour cette démo, nous simulons juste un succès.
    console.log('[balanceManager] Syncing with database...');
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  } catch (error) {
    console.error('Error syncing with database:', error);
    return false;
  }
};

/**
 * Nettoie les données utilisateur lors d'un changement d'utilisateur
 */
export const cleanupUserBalanceData = (): void => {
  currentBalance = null;
  highestBalance = null;
  dailyGains = 0;
  lastUpdateTimestamp = 0;
  
  try {
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('highestBalance');
    localStorage.removeItem('dailyGains');
    localStorage.removeItem('lastBalanceUpdateTime');
    localStorage.removeItem('dailySessionCount');
    localStorage.removeItem('lastDailyReset');
  } catch (error) {
    console.error('Error cleaning up user balance data:', error);
  }
};

export default {
  updateBalance,
  resetBalance,
  resetDailyCounters,
  getCurrentBalance,
  getHighestBalance,
  forceBalanceSync,
  addDailyGain,
  getDailyGains,
  initialize,
  forceUpdate,
  syncWithDatabase,
  addTransaction,
  cleanupUserBalanceData
};
