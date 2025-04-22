
/**
 * Gestionnaire centralisé pour la balance utilisateur avec progression automatique
 */

// Initialiser avec des valeurs par défaut
let currentBalance = 0;
let dailyGains = 0;
let highestBalance = 0;
const watchers: ((newBalance: number) => void)[] = [];
const lastKnownBalanceKey = 'last_known_balance';
const dailyGainsKey = 'daily_gains';
const lastVisitDateKey = 'last_visit_date';
const highestBalanceKey = 'highest_balance';

// Date du dernier reset quotidien
let lastResetDate = new Date().toDateString();

// Référence à la balance pour l'interface utilisateur
const balanceManager = {
  // Obtenir la balance actuelle
  getCurrentBalance: () => {
    // Récupérer depuis le localStorage si disponible
    const storedBalance = localStorage.getItem(lastKnownBalanceKey);
    if (storedBalance && !isNaN(parseFloat(storedBalance))) {
      currentBalance = parseFloat(storedBalance);
    }
    return currentBalance;
  },

  // Forcer la synchronisation de la balance avec une nouvelle valeur
  forceBalanceSync: (newBalance: number, userId?: string) => {
    if (isNaN(newBalance) || newBalance < 0) {
      console.error("Tentative de mise à jour avec une balance invalide:", newBalance);
      return;
    }
    
    // Mettre à jour la balance actuelle
    currentBalance = newBalance;
    
    // Enregistrer dans le localStorage pour persistance
    try {
      localStorage.setItem(lastKnownBalanceKey, newBalance.toString());
    } catch (e) {
      console.error("Erreur lors de l'enregistrement de la balance:", e);
    }
    
    // Mettre à jour la valeur maximale si nécessaire
    if (newBalance > highestBalance) {
      highestBalance = newBalance;
      localStorage.setItem(highestBalanceKey, newBalance.toString());
    }
    
    // Notifier les observateurs
    watchers.forEach(callback => callback(newBalance));
    
    return newBalance;
  },

  // Mettre à jour la balance en ajoutant un montant
  updateBalance: (amount: number) => {
    if (isNaN(amount)) {
      console.error("Montant invalide pour la mise à jour de la balance:", amount);
      return currentBalance;
    }
    
    // Ne jamais accepter de montants négatifs pour éviter les erreurs
    const safeAmount = Math.max(0, amount);
    
    // Calculer la nouvelle balance
    const newBalance = currentBalance + safeAmount;
    
    // Mettre à jour avec la valeur calculée
    return balanceManager.forceBalanceSync(newBalance);
  },

  // Ajouter un gain quotidien
  addDailyGain: (amount: number) => {
    const today = new Date().toDateString();
    
    // Réinitialiser les gains quotidiens si c'est un nouveau jour
    if (today !== lastResetDate) {
      dailyGains = 0;
      lastResetDate = today;
      localStorage.setItem('last_reset_date', today);
    }
    
    // Ajouter le gain au total journalier
    dailyGains += Math.max(0, amount);
    
    // Sauvegarder la valeur mise à jour
    try {
      localStorage.setItem(dailyGainsKey, dailyGains.toString());
    } catch (e) {
      console.error("Erreur lors de l'enregistrement des gains quotidiens:", e);
    }
    
    // Déclencher un événement pour notifier les composants
    window.dispatchEvent(new CustomEvent('dailyGains:updated', { 
      detail: { amount: dailyGains }
    }));
    
    return dailyGains;
  },

  // Obtenir le total des gains quotidiens
  getDailyGains: () => {
    // Vérifier si c'est un nouveau jour pour réinitialiser si nécessaire
    const today = new Date().toDateString();
    if (today !== lastResetDate) {
      dailyGains = 0;
      lastResetDate = today;
      localStorage.setItem('last_reset_date', today);
      localStorage.setItem(dailyGainsKey, '0');
      
      // Notifier les composants
      window.dispatchEvent(new CustomEvent('dailyGains:reset'));
    } else {
      // Récupérer depuis le localStorage si disponible
      const storedDailyGains = localStorage.getItem(dailyGainsKey);
      if (storedDailyGains && !isNaN(parseFloat(storedDailyGains))) {
        dailyGains = parseFloat(storedDailyGains);
      }
    }
    
    return dailyGains;
  },

  // Définir les gains quotidiens (pour synchronisation)
  setDailyGains: (amount: number) => {
    if (isNaN(amount) || amount < 0) {
      console.error("Montant invalide pour les gains quotidiens:", amount);
      return;
    }
    
    dailyGains = amount;
    
    try {
      localStorage.setItem(dailyGainsKey, amount.toString());
    } catch (e) {
      console.error("Erreur lors de l'enregistrement des gains quotidiens:", e);
    }
  },
  
  // Obtenir la balance maximale historique
  getHighestBalance: () => {
    // Récupérer depuis le localStorage si disponible
    const storedHighest = localStorage.getItem(highestBalanceKey);
    if (storedHighest && !isNaN(parseFloat(storedHighest))) {
      highestBalance = parseFloat(storedHighest);
    }
    return highestBalance;
  },
  
  // Mettre à jour la balance maximale
  updateHighestBalance: (balance: number) => {
    if (balance > highestBalance) {
      highestBalance = balance;
      localStorage.setItem(highestBalanceKey, balance.toString());
    }
    return highestBalance;
  },
  
  // Ajouter un observateur pour les changements de balance
  addWatcher: (callback: (newBalance: number) => void) => {
    watchers.push(callback);
    return () => {
      const index = watchers.indexOf(callback);
      if (index > -1) {
        watchers.splice(index, 1);
      }
    };
  },
  
  // Vérifier les changements significatifs de balance
  checkForSignificantBalanceChange: (newBalance: number) => {
    const current = balanceManager.getCurrentBalance();
    const significantThreshold = Math.max(0.1, current * 0.05); // 5% du solde ou 0.1€ minimum
    
    return Math.abs(newBalance - current) > significantThreshold;
  },
  
  // Simuler une progression hors ligne pour la dernière période d'absence
  simulateOfflineProgression: async () => {
    // Récupérer la date de dernière visite
    const lastVisitDate = localStorage.getItem(lastVisitDateKey) || new Date().toDateString();
    const today = new Date().toDateString();
    
    // Si c'est un nouveau jour, simuler une progression
    if (today !== lastVisitDate) {
      try {
        const lastVisit = new Date(lastVisitDate);
        const now = new Date();
        const daysDifference = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
        
        // Si au moins un jour s'est écoulé, simuler des gains
        if (daysDifference > 0) {
          // Gain journalier variable selon durée d'absence
          const dailyGainBase = 0.05 + (Math.random() * 0.15); // Entre 0.05€ et 0.20€ par jour
          const gainReduction = Math.min(0.5, daysDifference * 0.1); // Réduction progressive pour les absences longues
          const totalGain = Math.min(
            10, // Plafond à 10€ maximum quoi qu'il arrive
            dailyGainBase * daysDifference * (1 - gainReduction)
          );
          
          // Arrondir à 2 décimales
          const roundedGain = parseFloat(totalGain.toFixed(2));
          
          console.log(`Simulation de progression hors ligne: ${roundedGain}€ pour ${daysDifference} jour(s) d'absence`);
          
          // Mettre à jour le solde
          if (roundedGain > 0) {
            const newBalance = currentBalance + roundedGain;
            balanceManager.forceBalanceSync(newBalance);
            
            // Notifier l'utilisateur de cette progression
            window.dispatchEvent(new CustomEvent('balance:offline-progression', {
              detail: {
                amount: roundedGain,
                days: daysDifference
              }
            }));
            
            return roundedGain;
          }
        }
      } catch (error) {
        console.error("Erreur lors de la simulation de progression hors ligne:", error);
      }
    }
    
    // Mettre à jour la date de dernière visite
    localStorage.setItem(lastVisitDateKey, today);
    return 0;
  },
  
  // Synchroniser avec la base de données (pour simulation)
  syncWithDatabase: async () => {
    // Simuler une synchronisation avec la base de données
    // Cette méthode est destinée à être remplacée par une vraie synchro
    // Pour l'instant, c'est juste pour simuler une activité en arrière-plan
    console.log("Simulation de synchronisation avec la base de données...");
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // La vraie implémentation récupérerait le solde depuis la base de données
    return true;
  }
};

// Initialiser au chargement
(() => {
  // Récupérer les valeurs depuis le localStorage
  const storedBalance = localStorage.getItem(lastKnownBalanceKey);
  const storedDailyGains = localStorage.getItem(dailyGainsKey);
  const storedHighestBalance = localStorage.getItem(highestBalanceKey);
  const today = new Date().toDateString();
  const lastReset = localStorage.getItem('last_reset_date');
  
  // Initialiser la balance actuelle
  if (storedBalance && !isNaN(parseFloat(storedBalance))) {
    currentBalance = parseFloat(storedBalance);
  }
  
  // Initialiser les gains quotidiens
  if (today !== lastReset) {
    // Nouveau jour, réinitialiser les gains
    dailyGains = 0;
    localStorage.setItem('last_reset_date', today);
    localStorage.setItem(dailyGainsKey, '0');
  } else if (storedDailyGains && !isNaN(parseFloat(storedDailyGains))) {
    // Même jour, charger les gains existants
    dailyGains = parseFloat(storedDailyGains);
  }
  
  // Initialiser la balance maximale
  if (storedHighestBalance && !isNaN(parseFloat(storedHighestBalance))) {
    highestBalance = parseFloat(storedHighestBalance);
  } else {
    highestBalance = currentBalance;
    localStorage.setItem(highestBalanceKey, currentBalance.toString());
  }
  
  // Mettre à jour la date de dernière visite (celle d'avant aujourd'hui)
  const lastVisitDate = localStorage.getItem(lastVisitDateKey);
  if (!lastVisitDate) {
    localStorage.setItem(lastVisitDateKey, today);
  }
  
  lastResetDate = today;
})();

export default balanceManager;
