
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/userData";

/**
 * Ajoute une transaction avec mécanisme de retry
 */
export const addTransaction = async (userId: string, gain: number, report: string) => {
  // Vérifier les données d'entrée pour éviter les incohérences
  if (!userId) {
    console.error("addTransaction: userId manquant");
    return { success: false };
  }
  
  if (isNaN(gain) || gain <= 0) {
    console.error(`addTransaction: gain invalide (${gain})`);
    return { success: false };
  }
  
  // Formater le gain avec au maximum 2 décimales
  const formattedGain = parseFloat(gain.toFixed(2));
  const transactionDate = new Date().toISOString().split('T')[0];
  
  // Mécanisme de retry
  const maxRetries = 3;
  let retryCount = 0;
  
  // Ajouter un verrou pour éviter les transactions simultanées
  const transactionLockKey = `transaction_lock_${userId}`;
  const transactionLock = sessionStorage.getItem(transactionLockKey);
  
  if (transactionLock && Date.now() - parseInt(transactionLock) < 2000) {
    console.log("Transaction en cours, attente...");
    // Attendre un peu pour laisser la transaction précédente se terminer
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Définir le verrou avec l'horodatage actuel
  sessionStorage.setItem(transactionLockKey, Date.now().toString());
  
  try {
    while (retryCount < maxRetries) {
      try {
        console.log(`Ajout de transaction pour l'utilisateur ${userId} (gain: ${formattedGain}€, tentative: ${retryCount + 1}/${maxRetries})`);
        
        // Ajouter la transaction en base de données
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert([{
            user_id: userId,
            date: transactionDate,
            gain: formattedGain,
            report: report
          }]);
          
        if (transactionError) {
          console.error("Erreur lors de la création de la transaction:", transactionError);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            return { success: false };
          }
          
          // Attendre avant de réessayer avec backoff exponentiel
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
          continue;
        }
        
        // Déclencher un événement pour informer les autres composants
        window.dispatchEvent(new CustomEvent('transaction:added', {
          detail: {
            transaction: {
              date: transactionDate,
              gain: formattedGain,
              report: report
            }
          }
        }));
        
        return { 
          success: true, 
          transaction: {
            date: transactionDate,
            gain: formattedGain,
            report: report
          } 
        };
      } catch (error) {
        console.error(`Erreur lors de l'ajout de la transaction (tentative ${retryCount + 1}):`, error);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          return { success: false };
        }
        
        // Attendre avant de réessayer avec backoff exponentiel
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
      }
    }
  } finally {
    // Toujours libérer le verrou une fois terminé
    sessionStorage.removeItem(transactionLockKey);
  }
  
  return { success: false };
};

/**
 * Récupère toutes les transactions d'un utilisateur
 */
export const fetchUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
      
    if (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error("Exception while fetching transactions:", err);
    return [];
  }
};

/**
 * Calcule les gains totaux d'aujourd'hui pour un utilisateur
 */
export const calculateTodaysGains = async (userId: string): Promise<number> => {
  if (!userId) return 0;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('transactions')
      .select('gain')
      .eq('user_id', userId)
      .eq('date', today);
      
    if (error) {
      console.error("Error calculating today's gains:", error);
      return 0;
    }
    
    return (data || []).reduce((sum, tx) => sum + (tx.gain || 0), 0);
  } catch (err) {
    console.error("Exception while calculating today's gains:", err);
    return 0;
  }
};

/**
 * Récupère les transactions d'aujourd'hui
 */
export const fetchTodayTransactions = async (userId: string): Promise<Transaction[]> => {
  if (!userId) return [];
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching today's transactions:", error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error("Exception while fetching today's transactions:", err);
    return [];
  }
};
