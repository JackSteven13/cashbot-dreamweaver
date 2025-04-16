
import { supabase } from "@/integrations/supabase/client";
import { PlanType } from "./types";

/**
 * Vérifie l'abonnement actuel de l'utilisateur connecté
 */
export const checkCurrentSubscription = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('user_balances')
      .select('subscription')
      .eq('id', session.user.id)
      .single();
    
    if (error || !data) {
      console.error("Erreur lors de la vérification de l'abonnement:", error);
      return null;
    }
    
    return data.subscription;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'abonnement:", error);
    return null;
  }
};

/**
 * Met à jour l'abonnement local dans le localStorage
 */
export const updateLocalSubscription = async (subscription: string): Promise<boolean> => {
  try {
    localStorage.setItem('subscription', subscription);
    
    // Déclencher un événement pour notifier les autres composants
    window.dispatchEvent(new CustomEvent('subscription:updated', { 
      detail: { subscription } 
    }));
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'abonnement local:", error);
    return false;
  }
};

/**
 * Force une synchronisation complète de l'abonnement
 */
export const forceSyncSubscription = async (): Promise<boolean> => {
  try {
    const subscription = await checkCurrentSubscription();
    
    if (subscription) {
      await updateLocalSubscription(subscription);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Erreur lors de la synchronisation forcée:", error);
    return false;
  }
};

/**
 * Convertit un nom de plan en un objet PlanType
 */
export const planNameToPlanType = (planName: string): PlanType => {
  switch (planName?.toLowerCase()) {
    case 'starter':
    case 'alpha':
      return 'starter';
    case 'gold':
      return 'gold';
    case 'elite':
      return 'elite';
    default:
      return 'freemium';
  }
};

/**
 * Vérifie si l'utilisateur a un abonnement actif
 */
export const hasActiveSubscription = (): boolean => {
  const subscription = localStorage.getItem('subscription');
  return subscription !== null && subscription !== 'freemium';
};

/**
 * Obtient le niveau d'abonnement actuel
 */
export const getCurrentSubscriptionLevel = (): PlanType => {
  const subscription = localStorage.getItem('subscription') as PlanType;
  return subscription || 'freemium';
};
