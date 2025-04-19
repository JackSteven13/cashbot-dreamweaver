
/**
 * Gestionnaire centralisé du solde utilisateur avec état persistant
 */

// Configuration du gestionnaire
const PERSISTENCE_KEYS = {
  CURRENT_BALANCE: 'current_balance',
  HIGHEST_BALANCE: 'highest_balance',
  DAILY_INCREMENT: 'daily_balance_increment',
  LAST_BALANCE_UPDATE: 'last_balance_update',
  BALANCE_HISTORY: 'balance_history_records'
};

// État interne
const state = {
  currentBalance: 0,
  highestBalance: 0,
  lastUpdateTime: Date.now(),
  dailyGrowthFactor: 0,
  historyEntries: [] as { amount: number, timestamp: number, source: string }[],
  watchers: [] as ((balance: number) => void)[]
};

// Charger les valeurs au démarrage
const initialize = (initialBalance: number, withRandomness = true) => {
  try {
    // Récupérer toutes les sources de solde possible
    const storedCurrentBalance = parseFloat(localStorage.getItem(PERSISTENCE_KEYS.CURRENT_BALANCE) || '0');
    const storedHighestBalance = parseFloat(localStorage.getItem(PERSISTENCE_KEYS.HIGHEST_BALANCE) || '0');
    
    // Utiliser la valeur la plus élevée
    const persistedBalance = Math.max(storedCurrentBalance, storedHighestBalance, 0);
    
    // La valeur passée a priorité si elle est définie et supérieure aux valeurs stockées
    state.currentBalance = Math.max(initialBalance, persistedBalance);
    state.highestBalance = state.currentBalance;
    
    // Calculer un facteur de croissance quotidien aléatoire (entre 0.8% et 1.2% par jour)
    const randomFactor = withRandomness ? 0.8 + (Math.random() * 0.4) : 1;
    state.dailyGrowthFactor = randomFactor;
    
    // Charger l'historique
    try {
      const historyStr = localStorage.getItem(PERSISTENCE_KEYS.BALANCE_HISTORY);
      if (historyStr) {
        state.historyEntries = JSON.parse(historyStr);
      }
    } catch (e) {
      console.error("Erreur lors du chargement de l'historique des soldes:", e);
      state.historyEntries = [];
    }
    
    // Enregistrer les valeurs
    localStorage.setItem(PERSISTENCE_KEYS.CURRENT_BALANCE, state.currentBalance.toString());
    localStorage.setItem(PERSISTENCE_KEYS.HIGHEST_BALANCE, state.highestBalance.toString());
    localStorage.setItem(PERSISTENCE_KEYS.LAST_BALANCE_UPDATE, Date.now().toString());
    
    console.log(`[BalanceManager] Loaded persisted balance: ${state.currentBalance}`);
    console.log(`[BalanceManager] Daily growth factor: ${state.dailyGrowthFactor}`);
    
    // Programmer la croissance quotidienne
    scheduleDailyGrowth();
    
    // Notifier les observateurs
    notifyWatchers();
    
  } catch (error) {
    console.error("[BalanceManager] Error initializing:", error);
    state.currentBalance = initialBalance;
  }
};

// Forcer une valeur spécifique pour le solde
const forceBalanceSync = (newBalance: number) => {
  if (isNaN(newBalance) || newBalance < 0) return;
  
  // Mettre à jour seulement si la nouvelle valeur est plus élevée
  if (newBalance > state.currentBalance) {
    state.currentBalance = newBalance;
    
    // Mettre à jour le solde le plus élevé si nécessaire
    if (newBalance > state.highestBalance) {
      state.highestBalance = newBalance;
      localStorage.setItem(PERSISTENCE_KEYS.HIGHEST_BALANCE, newBalance.toString());
    }
    
    // Persister le nouveau solde
    localStorage.setItem(PERSISTENCE_KEYS.CURRENT_BALANCE, newBalance.toString());
    localStorage.setItem(PERSISTENCE_KEYS.LAST_BALANCE_UPDATE, Date.now().toString());
    
    // Enregistrer dans l'historique
    addToHistory(newBalance, 'sync');
    
    // Notifier les observateurs
    notifyWatchers();
  }
};

// Ajouter une entrée à l'historique
const addToHistory = (amount: number, source: string) => {
  try {
    // Ajouter la nouvelle entrée
    state.historyEntries.push({
      amount,
      timestamp: Date.now(),
      source
    });
    
    // Limiter à 100 entrées
    if (state.historyEntries.length > 100) {
      state.historyEntries = state.historyEntries.slice(-100);
    }
    
    // Persister l'historique
    localStorage.setItem(PERSISTENCE_KEYS.BALANCE_HISTORY, JSON.stringify(state.historyEntries));
  } catch (e) {
    console.error("Erreur lors de l'ajout à l'historique:", e);
  }
};

// Mettre à jour le solde (ajouter un gain)
const updateBalance = (gain: number) => {
  // Vérifier que le gain est positif et valide
  if (isNaN(gain) || gain <= 0) return;
  
  // Calculer le nouveau solde
  const newBalance = state.currentBalance + gain;
  state.currentBalance = newBalance;
  state.lastUpdateTime = Date.now();
  
  // Mettre à jour le solde maximum si nécessaire
  if (newBalance > state.highestBalance) {
    state.highestBalance = newBalance;
    localStorage.setItem(PERSISTENCE_KEYS.HIGHEST_BALANCE, newBalance.toString());
  }
  
  // Persister le nouveau solde
  localStorage.setItem(PERSISTENCE_KEYS.CURRENT_BALANCE, newBalance.toString());
  localStorage.setItem(PERSISTENCE_KEYS.LAST_BALANCE_UPDATE, Date.now().toString());
  
  // Ajouter à l'historique
  addToHistory(gain, 'update');
  
  // Notifier les observateurs
  notifyWatchers();
  
  return newBalance;
};

// Simuler une croissance naturelle du solde
const addBalanceGrowth = (amount: number) => {
  // Vérifier que le montant est positif et valide
  if (isNaN(amount) || amount <= 0) return;
  
  // Mettre à jour le solde
  const newBalance = state.currentBalance + amount;
  state.currentBalance = newBalance;
  state.lastUpdateTime = Date.now();
  
  // Mettre à jour le solde maximum si nécessaire
  if (newBalance > state.highestBalance) {
    state.highestBalance = newBalance;
    localStorage.setItem(PERSISTENCE_KEYS.HIGHEST_BALANCE, newBalance.toString());
  }
  
  // Persister le nouveau solde
  localStorage.setItem(PERSISTENCE_KEYS.CURRENT_BALANCE, newBalance.toString());
  localStorage.setItem(PERSISTENCE_KEYS.LAST_BALANCE_UPDATE, Date.now().toString());
  
  // Ajouter à l'historique avec source spéciale
  addToHistory(amount, 'growth');
  
  // Notifier les observateurs
  notifyWatchers();
  
  // Déclencher un événement balance:growth
  window.dispatchEvent(new CustomEvent('balance:growth', {
    detail: {
      amount,
      newBalance,
      timestamp: Date.now()
    }
  }));
  
  return newBalance;
};

// Programmer la croissance quotidienne
const scheduleDailyGrowth = () => {
  // Obtenir l'heure actuelle
  const now = new Date();
  
  // Calculer l'heure de la prochaine croissance (3:00 AM le jour suivant)
  const nextGrowth = new Date();
  nextGrowth.setDate(now.getDate() + 1);
  nextGrowth.setHours(3, 0, 0, 0);
  
  // Calculer le délai en millisecondes
  const delay = nextGrowth.getTime() - now.getTime();
  
  // Programmer la croissance
  setTimeout(() => {
    // Appliquer la croissance
    const lastGrowthStr = localStorage.getItem('last_balance_growth_date');
    const today = new Date().toDateString();
    
    if (lastGrowthStr !== today) {
      // Calculer la croissance (entre 1% et 3% du solde)
      const growthAmount = state.currentBalance * (0.01 + Math.random() * 0.02);
      
      // Arrondir à 2 décimales
      const roundedGrowth = parseFloat(growthAmount.toFixed(2));
      
      // Appliquer la croissance
      addBalanceGrowth(roundedGrowth);
      
      // Enregistrer la date
      localStorage.setItem('last_balance_growth_date', today);
      
      console.log(`[BalanceManager] Applied daily growth: +${roundedGrowth}€`);
    }
    
    // Planifier la prochaine croissance
    scheduleDailyGrowth();
  }, delay);
  
  return nextGrowth;
};

// Notifier tous les observateurs d'un changement de solde
const notifyWatchers = () => {
  state.watchers.forEach(watcher => {
    try {
      watcher(state.currentBalance);
    } catch (e) {
      console.error("Erreur lors de la notification d'un observateur:", e);
    }
  });
};

// Ajouter un observateur
const addWatcher = (callback: (balance: number) => void) => {
  state.watchers.push(callback);
  
  // Retourner une fonction pour supprimer l'observateur
  return () => {
    state.watchers = state.watchers.filter(w => w !== callback);
  };
};

// Obtenir le solde actuel
const getCurrentBalance = () => state.currentBalance;

// Obtenir le solde le plus élevé
const getHighestBalance = () => state.highestBalance;

// Obtenir l'historique des transactions
const getBalanceHistory = () => [...state.historyEntries];

// Exporter l'API publique
const balanceManager = {
  initialize,
  updateBalance,
  getCurrentBalance,
  getHighestBalance,
  getBalanceHistory,
  addWatcher,
  forceBalanceSync,
  addBalanceGrowth
};

export default balanceManager;
