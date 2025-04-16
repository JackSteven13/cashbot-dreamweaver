
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/userData';

/**
 * Récupère les transactions pour un utilisateur donné avec une meilleure gestion des dates
 */
export const fetchUserTransactions = async (userId: string, forceRefresh = false): Promise<Transaction[]> => {
  try {
    // Rechercher dans le cache si le forceRefresh n'est pas demandé
    if (!forceRefresh) {
      try {
        const cachedTx = localStorage.getItem('cachedTransactions');
        const lastRefreshTime = localStorage.getItem('transactionsLastRefresh');
        
        // Utiliser le cache seulement s'il existe et n'a pas plus de 5 minutes
        if (cachedTx && lastRefreshTime) {
          const cacheAge = Date.now() - parseInt(lastRefreshTime, 10);
          if (cacheAge < 300000) { // 5 minutes
            return JSON.parse(cachedTx);
          }
        }
      } catch (e) {
        console.warn("Cache access error:", e);
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
    
    // Formater les transactions pour les adapter au format requis par l'application
    const formattedTransactions = data.map((tx: any) => {
      // Normaliser la date pour assurer une bonne comparaison ultérieure
      const txDate = tx.created_at ? new Date(tx.created_at) : new Date();
      
      // Format ISO pour garantir la cohérence des dates
      const isoDate = txDate.toISOString();
      
      return {
        id: tx.id,
        date: isoDate,
        amount: tx.gain,
        type: tx.type,
        report: tx.description || tx.report, // Support both field names
        gain: tx.gain, // Par convention, les montants positifs sont des gains
      };
    });
    
    // Mettre à jour le cache
    try {
      localStorage.setItem('cachedTransactions', JSON.stringify(formattedTransactions));
      localStorage.setItem('transactionsLastRefresh', Date.now().toString());
    } catch (e) {
      console.warn("Cache write error:", e);
    }
    
    // Déboguer les transactions d'aujourd'hui
    const today = new Date();
    const todayTransactions = formattedTransactions.filter(tx => {
      try {
        const txDate = new Date(tx.date);
        return (
          txDate.getFullYear() === today.getFullYear() &&
          txDate.getMonth() === today.getMonth() &&
          txDate.getDate() === today.getDate()
        );
      } catch (e) {
        return false;
      }
    });
    
    console.log(`Transactions récupérées pour aujourd'hui: ${todayTransactions.length}/${formattedTransactions.length}`);
    
    return formattedTransactions;
  } catch (error) {
    console.error("Error in fetchUserTransactions:", error);
    return [];
  }
};

/**
 * Ajoute une nouvelle transaction pour un utilisateur
 */
export const addTransaction = async (
  userId: string,
  gain: number,
  description: string,
  type: string = 'system'
) => {
  try {
    // Utiliser la date actuelle (aujourd'hui) pour toutes les nouvelles transactions
    const today = new Date();
    const isoString = today.toISOString();
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        gain: gain,
        report: description,
        type,
        created_at: isoString,
        date: isoString.split('T')[0]  // Format YYYY-MM-DD pour la colonne date
      });
    
    if (error) {
      console.error("Error adding transaction:", error);
      return null;
    }
    
    // Invalider le cache des transactions
    localStorage.removeItem('cachedTransactions');
    
    // Déclencher un événement pour rafraîchir l'interface
    window.dispatchEvent(new CustomEvent('transactions:refresh'));
    
    return data ? data[0] : null;
  } catch (error) {
    console.error("Error in addTransaction:", error);
    return null;
  }
};
