
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/userData";

/**
 * Synchronise les transactions de l'utilisateur avec la base de données
 * et assure la cohérence entre le solde et l'historique des transactions
 */
export const syncTransactionsWithBalance = async (
  userId: string,
  currentBalance: number
): Promise<Transaction[]> => {
  if (!userId) {
    console.error("Impossible de synchroniser les transactions sans ID utilisateur");
    return [];
  }
  
  try {
    console.log(`Synchronisation des transactions pour l'utilisateur ${userId} avec un solde de ${currentBalance}€`);
    
    // 1. Récupérer toutes les transactions de l'utilisateur
    const { data: existingTransactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (fetchError) {
      console.error("Erreur lors de la récupération des transactions:", fetchError);
      return [];
    }
    
    // 2. Vérifier si le solde actuel correspond à la somme des transactions
    const transactionsSum = (existingTransactions || []).reduce(
      (sum, tx) => sum + (typeof tx.gain === 'number' ? Number(tx.gain) : 0), 
      0
    );
    
    console.log(`Solde calculé à partir des transactions: ${transactionsSum.toFixed(2)}€`);
    console.log(`Solde actuel en mémoire: ${currentBalance.toFixed(2)}€`);
    
    // 3. Si le solde ne correspond pas et qu'il est supérieur à la somme des transactions,
    // ajouter une transaction de réconciliation
    if (Math.abs(currentBalance - transactionsSum) > 0.01 && currentBalance > transactionsSum) {
      const difference = Number((currentBalance - transactionsSum).toFixed(2));
      console.log(`Différence détectée: ${difference}€. Création d'une transaction de réconciliation.`);
      
      // Créer une transaction de réconciliation
      const { data: newTransaction, error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          gain: difference,
          report: "Réconciliation de solde",
          date: new Date().toISOString().split('T')[0]
        })
        .select('*')
        .single();
        
      if (insertError) {
        console.error("Erreur lors de la création de la transaction de réconciliation:", insertError);
      } else if (newTransaction) {
        console.log("Transaction de réconciliation créée avec succès:", newTransaction);
        existingTransactions?.unshift(newTransaction);
      }
    }
    
    // 4. Mapper les transactions au format attendu par l'interface
    return (existingTransactions || []).map(t => ({
      id: t.id,
      date: t.date,
      amount: t.gain,
      gain: t.gain,
      type: t.report,
      report: t.report
    }));
  } catch (error) {
    console.error("Erreur lors de la synchronisation des transactions:", error);
    return [];
  }
};

/**
 * Récupère le compteur de sessions quotidien et met à jour la jauge de limite
 */
export const syncDailyLimitProgress = async (userId: string): Promise<number> => {
  if (!userId) return 0;
  
  try {
    // Récupérer le compteur de sessions quotidien
    const { data: userData, error } = await supabase
      .from('user_balances')
      .select('daily_session_count, subscription')
      .eq('id', userId)
      .single();
      
    if (error || !userData) {
      console.error("Erreur lors de la récupération du compteur de sessions:", error);
      return 0;
    }
    
    // Calculer la jauge de limite quotidienne en fonction de l'abonnement
    const maxSessionsPerDay = getMaxSessionsForSubscription(userData.subscription);
    const dailyLimitProgress = (userData.daily_session_count / maxSessionsPerDay) * 100;
    
    console.log(`Progression limite quotidienne: ${dailyLimitProgress.toFixed(2)}% (${userData.daily_session_count}/${maxSessionsPerDay})`);
    
    // Sauvegarder la progression dans le localStorage pour une utilisation hors ligne
    localStorage.setItem(`dailyLimitProgress_${userId}`, dailyLimitProgress.toString());
    localStorage.setItem(`dailySessionCount_${userId}`, userData.daily_session_count.toString());
    
    return dailyLimitProgress;
  } catch (error) {
    console.error("Erreur lors de la synchronisation de la limite quotidienne:", error);
    return 0;
  }
};

/**
 * Détermine le nombre maximum de sessions par jour en fonction de l'abonnement
 */
function getMaxSessionsForSubscription(subscription: string): number {
  switch (subscription) {
    case 'starter':
    case 'alpha':
      return 12;
    case 'gold':
      return 24;
    case 'elite':
      return 50;
    case 'freemium':
    default:
      return 5;
  }
}
