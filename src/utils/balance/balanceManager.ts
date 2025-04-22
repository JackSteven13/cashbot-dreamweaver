
import { persistBalance, getPersistedBalance } from './balanceStorage';

interface BalanceManagerInstance {
  getCurrentBalance: () => number;
  updateBalance: (amount: number) => number;
  forceBalanceSync: (amount: number, userId?: string) => void;
  getDailyGains: () => number;
  addDailyGain: (gain: number) => void;
  updateHighestBalance: (balance: number) => void;
  resetDailyGains: () => void;
}

/**
 * Gestionnaire centralisé pour toutes les opérations liées au solde
 * Garantit la cohérence entre les différentes parties de l'application
 */
const createBalanceManager = (): BalanceManagerInstance => {
  let currentBalance = 0;
  let dailyGains = 0;
  let highestBalance = 0;
  let lastKnownUserId: string | undefined;
  let isInitialized = false;

  // Initialisation du solde depuis le stockage local
  const initialize = (userId?: string) => {
    if (isInitialized && userId === lastKnownUserId) return;
    
    console.log("Initialisation du gestionnaire de solde...");
    
    // Récupérer le solde persisté pour l'utilisateur spécifique
    currentBalance = getPersistedBalance(userId);
    highestBalance = currentBalance;
    
    // Récupérer les gains quotidiens
    try {
      const storedDailyGains = localStorage.getItem('dailyGains');
      dailyGains = storedDailyGains ? parseFloat(storedDailyGains) : 0;
      
      if (isNaN(dailyGains)) {
        console.error("Valeur invalide dans dailyGains, réinitialisation à 0");
        dailyGains = 0;
      }
    } catch (e) {
      console.error("Erreur lors de la récupération des gains quotidiens:", e);
      dailyGains = 0;
    }
    
    isInitialized = true;
    lastKnownUserId = userId;
    
    console.log(`BalanceManager initialisé: Solde=${currentBalance}€, Gains quotidiens=${dailyGains}€`);
  };

  // Obtenir le solde actuel
  const getCurrentBalance = (): number => {
    if (!isInitialized) {
      initialize();
    }
    return currentBalance;
  };

  // Mettre à jour le solde avec un montant (positif ou négatif)
  const updateBalance = (amount: number): number => {
    if (!isInitialized) {
      initialize();
    }
    
    // Éviter les NaN
    if (isNaN(amount)) {
      console.error("Tentative de mise à jour du solde avec une valeur non numérique");
      return currentBalance;
    }
    
    // Arrondir à 2 décimales pour éviter les erreurs de calcul flottant
    const newBalance = parseFloat((currentBalance + amount).toFixed(2));
    currentBalance = newBalance;
    
    // Persister immédiatement le nouveau solde pour éviter les incohérences
    persistBalance(newBalance, lastKnownUserId);
    
    // Mettre à jour le solde le plus élevé si nécessaire
    if (newBalance > highestBalance) {
      highestBalance = newBalance;
    }
    
    console.log(`Solde mis à jour: ${currentBalance}€ (modification: ${amount > 0 ? '+' : ''}${amount}€)`);
    return currentBalance;
  };

  // Force la synchronisation du solde à une valeur spécifique
  const forceBalanceSync = (amount: number, userId?: string): void => {
    if (userId && userId !== lastKnownUserId) {
      // Si l'ID utilisateur a changé, réinitialiser
      isInitialized = false;
      lastKnownUserId = userId;
    }
    
    if (!isInitialized) {
      initialize(userId);
    }
    
    // Éviter les NaN
    if (isNaN(amount)) {
      console.error("Tentative de synchronisation du solde avec une valeur non numérique");
      return;
    }
    
    // Arrondir à 2 décimales
    const safeAmount = parseFloat(amount.toFixed(2));
    
    // Ne pas permettre la réduction du solde sauf si explicitement demandé avec userId
    if (safeAmount < currentBalance && !userId) {
      console.warn(`Tentative de réduction de solde sans ID utilisateur: ${currentBalance}€ -> ${safeAmount}€`);
      return;
    }
    
    // Mettre à jour et persister le solde
    currentBalance = safeAmount;
    persistBalance(safeAmount, userId);
    
    // Mettre à jour le solde le plus élevé si nécessaire
    if (safeAmount > highestBalance) {
      highestBalance = safeAmount;
    }
    
    console.log(`Solde synchronisé forcément: ${currentBalance}€`);
  };

  // Obtenir les gains quotidiens
  const getDailyGains = (): number => {
    if (!isInitialized) {
      initialize();
    }
    return dailyGains;
  };

  // Ajouter un gain quotidien
  const addDailyGain = (gain: number): void => {
    if (!isInitialized) {
      initialize();
    }
    
    // Éviter les NaN
    if (isNaN(gain) || gain < 0) {
      console.error("Tentative d'ajout de gain quotidien invalide");
      return;
    }
    
    // Arrondir à 2 décimales
    const safeGain = parseFloat(gain.toFixed(2));
    dailyGains = parseFloat((dailyGains + safeGain).toFixed(2));
    
    try {
      localStorage.setItem('dailyGains', dailyGains.toString());
    } catch (e) {
      console.error("Erreur lors de la persistance des gains quotidiens:", e);
    }
    
    console.log(`Gains quotidiens mis à jour: ${dailyGains}€ (ajout: +${safeGain}€)`);
  };

  // Mise à jour du solde le plus élevé
  const updateHighestBalance = (balance: number): void => {
    if (balance > highestBalance) {
      highestBalance = balance;
      console.log(`Solde le plus élevé mis à jour: ${highestBalance}€`);
    }
  };

  // Réinitialiser les gains quotidiens (appelé à minuit)
  const resetDailyGains = (): void => {
    dailyGains = 0;
    try {
      localStorage.setItem('dailyGains', '0');
      console.log("Gains quotidiens réinitialisés");
    } catch (e) {
      console.error("Erreur lors de la réinitialisation des gains quotidiens:", e);
    }
  };

  return {
    getCurrentBalance,
    updateBalance,
    forceBalanceSync,
    getDailyGains,
    addDailyGain,
    updateHighestBalance,
    resetDailyGains
  };
};

// Singleton pour garantir la cohérence dans toute l'application
const balanceManager = createBalanceManager();

export default balanceManager;
