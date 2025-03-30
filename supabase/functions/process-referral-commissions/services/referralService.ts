
import { supabase } from "../utils/supabaseClient.ts";
import { withRetry } from "../utils/retryMechanism.ts";
import { createDetailedError } from "../utils/errorHandler.ts";

/**
 * Récupère tous les parrainages actifs
 * @returns Un tableau de parrainages actifs
 */
export async function getActiveReferrals(): Promise<any[]> {
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*, user_balances!referrer_id(subscription)')
        .eq('status', 'active');
        
      if (error) {
        throw createDetailedError(
          "Erreur lors de la récupération des parrainages actifs",
          { supabaseError: error }
        );
      }
      
      return data || [];
    }, 3, 1000); // Retry up to 3 times with 1s initial delay
  } catch (error) {
    console.error("Erreur lors de la récupération des parrainages actifs:", error);
    throw error; // Propager l'erreur pour être gérée par la fonction appelante
  }
}
