
import { supabase } from "@/integrations/supabase/client";
import { addTransaction } from "./transactionUtils";
import { SUBSCRIPTION_LIMITS } from "./subscription/constants";

// Constantes pour la gestion de la dormance
export const DORMANCY_CONSTANTS = {
  DORMANCY_DAYS: 30, // Jours avant qu'un compte devienne dormant
  PENALTY_PERCENT: 5, // Pourcentage de pénalité par mois de dormance
  MAX_PENALTY_PERCENT: 25, // Pénalité maximale
  REACTIVATION_FEE: 2.5, // Frais de réactivation en euros
};

/**
 * Met à jour le solde d'un utilisateur
 */
export const updateUserBalance = async (
  userId: string, 
  currentBalance: number, 
  gain: number, 
  subscriptionType: string = 'freemium'
) => {
  try {
    // Vérifier les limites quotidiennes
    const dailyLimit = SUBSCRIPTION_LIMITS[subscriptionType as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    const todayGains = await checkDailyLimit(userId);
    
    // Calculer le gain réel en tenant compte de la limite quotidienne
    let actualGain = gain;
    let limitReached = false;
    
    if (todayGains + gain > dailyLimit) {
      actualGain = Math.max(0, dailyLimit - todayGains);
      limitReached = true;
      console.log(`Limite quotidienne atteinte. Gain ajusté de ${gain} à ${actualGain}`);
    }
    
    if (actualGain <= 0) {
      console.log("Aucun gain à ajouter en raison des limites quotidiennes");
      return { 
        success: false, 
        limitReached: true,
        message: "Limite quotidienne atteinte" 
      };
    }
    
    // Formater le gain avec 2 décimales pour éviter les erreurs d'arrondi
    const formattedGain = parseFloat(actualGain.toFixed(2));
    const newBalance = parseFloat((currentBalance + formattedGain).toFixed(2));
    
    // Mettre à jour le solde dans la base de données
    const { error } = await supabase
      .from('user_balances')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error("Erreur lors de la mise à jour du solde:", error);
      return { success: false };
    }

    // Sauvegarder en local storage pour éviter les pertes
    try {
      // Utiliser des clés spécifiques à l'utilisateur pour éviter les conflits
      localStorage.setItem(`user_balance_${userId}`, newBalance.toString());
      localStorage.setItem(`last_known_balance_${userId}`, newBalance.toString());
      localStorage.setItem('currentBalance', newBalance.toString());
      localStorage.setItem('lastKnownBalance', newBalance.toString());
      
      // Sauvegarder l'horodatage de la dernière mise à jour
      localStorage.setItem(`last_balance_update_${userId}`, Date.now().toString());
      localStorage.setItem('lastBalanceUpdateTime', Date.now().toString());
    } catch (e) {
      console.warn("Erreur lors de la sauvegarde du solde en local storage:", e);
    }
    
    // Déclencher un événement pour mettre à jour l'interface
    window.dispatchEvent(new CustomEvent('balance:update', {
      detail: {
        oldBalance: currentBalance,
        newBalance: newBalance,
        gain: formattedGain,
      }
    }));
    
    console.log(`Solde mis à jour avec succès: ${currentBalance} + ${formattedGain} = ${newBalance}`);
    
    return { 
      success: true, 
      newBalance: newBalance,
      limitReached: limitReached
    };
  } catch (error) {
    console.error("Erreur dans updateUserBalance:", error);
    return { success: false };
  }
};

/**
 * Réinitialise le solde d'un utilisateur (pour les retraits)
 */
export const resetUserBalance = async (userId: string, currentBalance: number) => {
  try {
    if (currentBalance <= 0) {
      console.log("Solde déjà à zéro, aucun retrait nécessaire");
      return { success: false, message: "Solde déjà à zéro" };
    }
    
    // Mettre à jour le solde à zéro dans la base de données
    const { error } = await supabase
      .from('user_balances')
      .update({ 
        balance: 0, 
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error("Erreur lors de la réinitialisation du solde:", error);
      return { success: false };
    }
    
    // Créer une transaction pour le retrait
    const transaction = await addTransaction(
      userId,
      -currentBalance, // Montant négatif pour un retrait
      "Retrait de fonds"
    );
    
    // Nettoyer le stockage local
    try {
      localStorage.setItem(`user_balance_${userId}`, "0");
      localStorage.setItem(`last_known_balance_${userId}`, "0");
      localStorage.setItem('currentBalance', "0");
      localStorage.setItem('lastKnownBalance', "0");
    } catch (e) {
      console.warn("Erreur lors du nettoyage du stockage local:", e);
    }
    
    // Informer l'interface de la mise à jour
    window.dispatchEvent(new CustomEvent('balance:update', {
      detail: {
        oldBalance: currentBalance,
        newBalance: 0,
        gain: -currentBalance,
      }
    }));
    
    console.log(`Solde réinitialisé avec succès. Montant retiré: ${currentBalance}`);
    
    return { 
      success: true,
      transaction: {
        date: new Date().toISOString(),
        gain: currentBalance,
        report: "Retrait de fonds"
      }
    };
  } catch (error) {
    console.error("Erreur dans resetUserBalance:", error);
    return { success: false };
  }
};

/**
 * Met à jour le compteur de sessions quotidiennes
 */
export const updateSessionCount = async (userId: string, currentCount: number) => {
  try {
    const newCount = currentCount + 1;
    
    const { error } = await supabase
      .from('user_balances')
      .update({ daily_session_count: newCount })
      .eq('id', userId);
      
    if (error) {
      console.error("Erreur lors de la mise à jour du compteur de sessions:", error);
      return currentCount;
    }
    
    return newCount;
  } catch (error) {
    console.error("Erreur dans updateSessionCount:", error);
    return currentCount;
  }
};

/**
 * Vérifie si un compte est en dormance (inactif depuis longtemps)
 */
export const checkAccountDormancy = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_balances')
      .select('updated_at')
      .eq('id', userId)
      .single();
      
    if (error || !data) {
      return { dormant: false, daysSinceUpdate: 0 };
    }
    
    const lastUpdate = new Date(data.updated_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return { 
      dormant: diffDays > DORMANCY_CONSTANTS.DORMANCY_DAYS,
      daysSinceUpdate: diffDays
    };
  } catch (error) {
    console.error("Erreur dans checkAccountDormancy:", error);
    return { dormant: false, daysSinceUpdate: 0 };
  }
};

/**
 * Calcule les pénalités de dormance
 */
export const calculateDormancyPenalties = (balance: number, daysSinceUpdate: number) => {
  const monthsInactive = Math.floor(daysSinceUpdate / 30);
  if (monthsInactive <= 0) return 0;
  
  const penaltyPercent = Math.min(
    DORMANCY_CONSTANTS.MAX_PENALTY_PERCENT, 
    monthsInactive * DORMANCY_CONSTANTS.PENALTY_PERCENT
  );
  
  return parseFloat((balance * (penaltyPercent / 100)).toFixed(2));
};

/**
 * Applique les pénalités de dormance au solde
 */
export const applyDormancyPenalties = async (userId: string, balance: number, penalties: number) => {
  try {
    if (penalties <= 0) return { success: true, newBalance: balance };
    
    const newBalance = parseFloat((balance - penalties).toFixed(2));
    
    const { error } = await supabase
      .from('user_balances')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error("Erreur lors de l'application des pénalités:", error);
      return { success: false };
    }
    
    // Créer une transaction pour les pénalités
    await addTransaction(
      userId,
      -penalties,
      "Frais d'inactivité"
    );
    
    return { 
      success: true, 
      newBalance 
    };
  } catch (error) {
    console.error("Erreur dans applyDormancyPenalties:", error);
    return { success: false };
  }
};

/**
 * Calcule les frais de réactivation d'un compte
 */
export const calculateReactivationFee = () => {
  return DORMANCY_CONSTANTS.REACTIVATION_FEE;
};

/**
 * Réactive un compte dormant
 */
export const reactivateAccount = async (userId: string, currentBalance: number) => {
  try {
    const reactivationFee = calculateReactivationFee();
    const newBalance = Math.max(0, currentBalance - reactivationFee);
    
    const { error } = await supabase
      .from('user_balances')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error("Erreur lors de la réactivation du compte:", error);
      return { success: false };
    }
    
    // Créer une transaction pour les frais de réactivation
    if (reactivationFee > 0) {
      await addTransaction(
        userId,
        -reactivationFee,
        "Frais de réactivation de compte"
      );
    }
    
    return { 
      success: true, 
      newBalance,
      fee: reactivationFee
    };
  } catch (error) {
    console.error("Erreur dans reactivateAccount:", error);
    return { success: false };
  }
};

/**
 * Vérifie la limite quotidienne et retourne le total des gains du jour
 */
export const checkDailyLimit = async (userId: string) => {
  try {
    // Récupérer la date d'aujourd'hui au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Requête pour obtenir les transactions d'aujourd'hui
    const { data, error } = await supabase
      .from('transactions')
      .select('gain')
      .eq('user_id', userId)
      .gte('date', today)
      .lt('date', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0])
      .filter('gain', 'gt', 0); // Seulement les gains positifs
      
    if (error) {
      console.error("Erreur lors de la vérification des limites quotidiennes:", error);
      return 0;
    }
    
    // Calculer le total des gains
    const totalGains = data.reduce((sum, tx) => sum + (tx.gain || 0), 0);
    console.log(`Gains totaux pour aujourd'hui: ${totalGains}`);
    
    return totalGains;
  } catch (error) {
    console.error("Erreur dans checkDailyLimit:", error);
    return 0;
  }
};
