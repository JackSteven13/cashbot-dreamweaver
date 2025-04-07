
import { supabase } from "@/integrations/supabase/client";
import { PlanType } from "./types";

export const createCheckoutSession = async (
  plan: PlanType,
  successUrl: string,
  cancelUrl: string,
  referralCode: string | null
) => {
  try {
    // Récupérer l'abonnement actuel de l'utilisateur
    const { data: userData, error: userDataError } = await supabase
      .from('user_balances')
      .select('subscription')
      .single();
      
    const currentSubscription = userDataError ? null : userData?.subscription;
    
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        plan,
        successUrl,
        cancelUrl,
        referralCode,
        currentSubscription
      }
    });
    
    if (error) {
      console.error("Function error:", error);
      throw new Error(`Erreur de service: ${error.message}`);
    }
    
    if (data?.error) {
      // Si l'utilisateur essaie de souscrire au même plan
      if (data.code === 'SAME_PLAN') {
        throw new Error('SAME_PLAN: Vous êtes déjà abonné à ce forfait');
      }
      console.error("Stripe configuration error:", data.error);
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error("Error in createCheckoutSession:", error);
    throw error;
  }
};

export const updateSubscription = async (userId: string, plan: PlanType) => {
  const { error: updateError } = await supabase
    .from('user_balances')
    .update({ 
      subscription: plan,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
    
  if (updateError) {
    throw updateError;
  }
  
  return { success: true };
};
