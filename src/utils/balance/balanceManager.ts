
/**
 * Gestionnaire central du solde utilisateur pour éviter les désynchronisations
 * et assurer la persistance même en cas de problèmes réseau
 */

// Variables de stockage local
let currentBalance: number | null = null;
let highestBalance: number | null = null;
let lastUpdateTimestamp: number = 0;

// Initialisation à partir du stockage local si disponible
const initialize = () => {
  try {
    const storedBalance = localStorage.getItem('currentBalance');
    const storedHighestBalance = localStorage.getItem('highestBalance');
    
    if (storedBalance) {
      currentBalance = parseFloat(storedBalance);
    }
    
    if (storedHighestBalance) {
      highestBalance = parseFloat(storedHighestBalance);
    } else if (currentBalance !== null) {
      highestBalance = currentBalance;
    }
    
    const storedTimestamp = localStorage.getItem('lastBalanceUpdateTime');
    if (storedTimestamp) {
      lastUpdateTimestamp = new Date(storedTimestamp).getTime();
    }
    
    console.log(`[balanceManager] Initialized - Current: ${currentBalance}, Highest: ${highestBalance}`);
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
    
    console.log('[balanceManager] Daily counters reset');
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

export default {
  updateBalance,
  resetBalance,
  resetDailyCounters,
  getCurrentBalance,
  getHighestBalance,
  forceBalanceSync
};
