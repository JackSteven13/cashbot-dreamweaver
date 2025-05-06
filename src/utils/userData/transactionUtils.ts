import { supabase } from '@/integrations/supabase/client';

/**
 * Calculer les gains d'aujourd'hui pour un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Le total des gains d'aujourd'hui
 */
export const calculateTodaysGains = async (userId: string): Promise<number> => {
  try {
    // Obtenir la date d'aujourd'hui au format UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    // Récupérer les transactions de la journée
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'credit')
      .gte('created_at', todayStr);
    
    if (error) {
      console.error("Erreur lors du calcul des gains:", error);
      return 0;
    }
    
    // Calculer la somme des gains
    return data?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;
  } catch (err) {
    console.error("Erreur dans calculateTodaysGains:", err);
    return 0;
  }
};

/**
 * Calculer les dépenses d'aujourd'hui pour un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Le total des dépenses d'aujourd'hui
 */
export const calculateTodaysExpenses = async (userId: string): Promise<number> => {
  try {
    // Obtenir la date d'aujourd'hui au format UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    // Récupérer les transactions de la journée
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'debit')
      .gte('created_at', todayStr);
    
    if (error) {
      console.error("Erreur lors du calcul des dépenses:", error);
      return 0;
    }
    
    // Calculer la somme des dépenses
    return data?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;
  } catch (err) {
    console.error("Erreur dans calculateTodaysExpenses:", err);
    return 0;
  }
};

/**
 * Récupérer l'historique des transactions d'un utilisateur
 * @param userId ID de l'utilisateur
 * @param page Le numéro de la page à récupérer
 * @param pageSize Le nombre de transactions par page
 * @returns Une liste de transactions
 */
export const getTransactionHistory = async (userId: string, page: number, pageSize: number) => {
  const startIndex = (page - 1) * pageSize;

  try {
    const { data, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(startIndex, startIndex + pageSize - 1);

    if (error) {
      console.error("Erreur lors de la récupération de l'historique des transactions:", error);
      return { data: [], count: 0 };
    }

    return { data: data || [], count: count || 0 };
  } catch (err) {
    console.error("Erreur dans getTransactionHistory:", err);
    return { data: [], count: 0 };
  }
};
