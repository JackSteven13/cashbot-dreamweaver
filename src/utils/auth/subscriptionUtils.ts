
import { supabase } from '@/integrations/supabase/client';

// Vérifier si l'utilisateur a atteint la limite quotidienne
export const checkDailyLimit = async (userId: string): Promise<boolean> => {
  try {
    const { data } = await supabase.from('user_balances')
      .select('daily_session_count, subscription')
      .eq('id', userId)
      .single();
      
    if (!data) return false;
    
    const { daily_session_count, subscription } = data;
    
    // Détermine la limite en fonction de l'abonnement
    let limit = 5;  // Par défaut pour freemium
    
    if (subscription === 'starter') limit = 10;
    else if (subscription === 'gold') limit = 25;
    else if (subscription === 'elite') limit = 50;
    
    return daily_session_count < limit;
  } catch (error) {
    console.error("Erreur lors de la vérification des limites:", error);
    return false;
  }
};

// Obtenir le niveau d'abonnement effectif de l'utilisateur
export const getEffectiveSubscription = async (userId: string): Promise<string> => {
  try {
    const { data } = await supabase
      .from('user_balances')
      .select('subscription')
      .eq('id', userId)
      .single();
      
    return data?.subscription || 'freemium';
  } catch (error) {
    console.error("Erreur lors de la récupération de l'abonnement:", error);
    return 'freemium';  // Par défaut
  }
};

// S'abonner aux changements d'authentification
export const subscribeToAuthChanges = (callback: (event: string, session: any) => void) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  
  return data.subscription;
};

// Se désabonner des changements d'authentification
export const unsubscribeFromAuthChanges = (subscription: { unsubscribe: () => void }) => {
  if (subscription && typeof subscription.unsubscribe === 'function') {
    subscription.unsubscribe();
  }
};
