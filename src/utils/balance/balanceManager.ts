
import { getDailyGains, addDailyGain, resetDailyGains } from './persistentGainsTracker';
import { supabase } from "@/integrations/supabase/client";

// État local pour le solde
let currentBalance = 0;
let currentUserId = null;
const subscribers = new Set();

/**
 * Récupère le solde le plus élevé enregistré
 */
export const getHighestBalance = (): number => {
  try {
    const stored = localStorage.getItem('highestBalance');
    return stored ? parseFloat(stored) : 0;
  } catch (e) {
    return 0;
  }
};

/**
 * Récupère le solde actuel
 */
export const getBalance = (): number => {
  return currentBalance;
};

/**
 * S'abonner aux mises à jour du solde
 */
export const subscribe = (callback) => {
  subscribers.add(callback);
  
  // Envoyer l'état actuel immédiatement
  callback({
    lastKnownBalance: currentBalance,
    userId: currentUserId
  });
  
  // Renvoyer une fonction de désabonnement
  return () => {
    subscribers.delete(callback);
  };
};

/**
 * Notifier tous les abonnés d'un changement de solde
 */
const notifySubscribers = () => {
  subscribers.forEach(callback => {
    callback({
      lastKnownBalance: currentBalance,
      userId: currentUserId
    });
  });
};

/**
 * Initialiser le gestionnaire avec un solde et un ID utilisateur
 */
export const initialize = (balance, userId = null) => {
  if (typeof balance === 'number' && !isNaN(balance)) {
    currentBalance = balance;
    
    if (userId) {
      currentUserId = userId;
    }
    
    notifySubscribers();
  }
};

/**
 * Met à jour le solde local
 */
const updateBalance = (amount: number): number => {
  try {
    // Pour un gain, ajouter au solde existant
    if (amount > 0) {
      currentBalance += amount;
      
      // Mettre à jour également le solde maximum si nécessaire
      const highestBalance = getHighestBalance();
      if (currentBalance > highestBalance) {
        localStorage.setItem('highestBalance', currentBalance.toString());
      }
      
      // Toujours sauvegarder le solde courant
      localStorage.setItem('currentBalance', currentBalance.toString());
      localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
      
      // Ajouter au compteur de gains quotidiens
      addDailyGain(amount);
      
      // Notifier les abonnés
      notifySubscribers();
    } 
    // Pour une réinitialisation, mettre à zéro
    else if (amount === 0) {
      currentBalance = 0;
      localStorage.removeItem('currentBalance');
      
      // Notifier les abonnés
      notifySubscribers();
    }
    
    return currentBalance;
  } catch (e) {
    console.error("Erreur lors de la mise à jour du solde:", e);
    return currentBalance;
  }
};

/**
 * Force une mise à jour avec un solde spécifique
 */
const forceUpdate = (newBalance: number): number => {
  try {
    currentBalance = newBalance;
    
    // Mettre à jour également le solde maximum si nécessaire
    const highestBalance = getHighestBalance();
    if (currentBalance > highestBalance) {
      localStorage.setItem('highestBalance', currentBalance.toString());
    }
    
    // Toujours sauvegarder le solde courant
    localStorage.setItem('currentBalance', currentBalance.toString());
    localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
    
    // Notifier les abonnés
    notifySubscribers();
    
    return currentBalance;
  } catch (e) {
    console.error("Erreur lors de la mise à jour forcée du solde:", e);
    return currentBalance;
  }
};

/**
 * Réinitialise complètement le solde
 */
const resetBalance = (): void => {
  currentBalance = 0;
  
  try {
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('lastKnownBalance');
    localStorage.removeItem('lastBalanceUpdateTime');
    
    // Notifier les abonnés
    notifySubscribers();
  } catch (e) {
    console.error("Erreur lors de la réinitialisation du solde:", e);
  }
};

/**
 * Nettoyer les données de solde d'un utilisateur
 */
export const cleanupUserBalanceData = (): void => {
  currentBalance = 0;
  currentUserId = null;
  
  try {
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('lastKnownBalance');
    localStorage.removeItem('lastBalanceUpdateTime');
    localStorage.removeItem('highestBalance');
    localStorage.removeItem('dailyGains');
    localStorage.removeItem('lastGainDate');
  } catch (e) {
    console.error("Erreur lors du nettoyage des données de solde:", e);
  }
};

/**
 * Réinitialise uniquement les compteurs quotidiens
 */
const resetDailyCounters = (): void => {
  resetDailyGains();
};

/**
 * Ajoute une transaction à la base de données
 */
const addTransaction = async (userId: string, gain: number, report: string): Promise<boolean> => {
  try {
    // Format transaction date as YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        { user_id: userId, gain, report, date: today }
      ]);
    
    if (error) {
      console.error("Erreur lors de l'ajout d'une transaction:", error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error("Erreur lors de l'ajout d'une transaction:", e);
    return false;
  }
};

/**
 * Synchronise le solde avec la base de données
 */
const syncWithDatabase = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.error("Pas de session utilisateur pour la synchronisation");
      return false;
    }
    
    // Obtenir le solde actuel depuis la base de données
    const { data, error } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error("Erreur lors de la récupération du solde depuis la BD:", error);
      return false;
    }
    
    const dbBalance = data?.balance || 0;
    const localBalance = Math.max(currentBalance, getHighestBalance());
    
    // Si notre solde local est plus élevé, mettre à jour la base de données
    if (localBalance > dbBalance) {
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ balance: localBalance, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);
      
      if (updateError) {
        console.error("Erreur lors de la mise à jour du solde dans la BD:", updateError);
        return false;
      }
      
      console.log(`Solde synchronisé avec succès: ${localBalance}€`);
    }
    
    return true;
  } catch (e) {
    console.error("Erreur lors de la synchronisation du solde:", e);
    return false;
  }
};

// Initialiser le solde à partir du stockage local
try {
  const storedBalance = localStorage.getItem('currentBalance');
  if (storedBalance) {
    currentBalance = parseFloat(storedBalance);
  }
} catch (e) {
  console.error("Erreur lors de l'initialisation du solde:", e);
}

export { getDailyGains, addDailyGain, resetDailyGains };

export default {
  updateBalance,
  forceUpdate,
  resetBalance,
  resetDailyCounters,
  getHighestBalance,
  getBalance,
  initialize,
  subscribe,
  addTransaction,
  syncWithDatabase,
  cleanupUserBalanceData
};
