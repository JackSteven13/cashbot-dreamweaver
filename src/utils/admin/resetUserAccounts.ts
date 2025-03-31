
// Cette fonction n'est utilisée que par les administrateurs
// Elle permet de réinitialiser les comptes utilisateurs pour les tests

import { supabase } from "@/integrations/supabase/client";

export interface ResetUserParams {
  userId?: string;
  resetBalance?: boolean;
  resetSubscription?: boolean;
  resetReferrals?: boolean;
  resetTransactions?: boolean;
}

export const resetUserAccount = async (params: ResetUserParams) => {
  const {
    userId,
    resetBalance = false,
    resetSubscription = false,
    resetReferrals = false,
    resetTransactions = false
  } = params;

  if (!userId) {
    console.error("ID utilisateur requis pour la réinitialisation");
    return { success: false, error: "ID utilisateur requis" };
  }

  try {
    // Réinitialiser le solde si demandé
    if (resetBalance) {
      const { error } = await supabase
        .from("user_balances")
        .update({ balance: 0, daily_session_count: 0 })
        .eq("id", userId);

      if (error) throw error;
    }

    // Réinitialiser l'abonnement si demandé
    if (resetSubscription) {
      const { error } = await supabase
        .from("user_balances")
        .update({ subscription: "freemium" })
        .eq("id", userId);

      if (error) throw error;
    }

    // Supprimer les transactions si demandé
    if (resetTransactions) {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
    }

    // Supprimer les parrainages si demandé
    if (resetReferrals) {
      const { error } = await supabase
        .from("referrals")
        .delete()
        .or(`referrer_id.eq.${userId},referred_user_id.eq.${userId}`);

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du compte:", error);
    return { success: false, error };
  }
};
