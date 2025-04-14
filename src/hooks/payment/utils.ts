
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Check for the current subscription in Supabase
 */
export const checkCurrentSubscription = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) return null;
    
    // First try the RPC function (more reliable)
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_current_subscription', { user_id: session.user.id });
      
      if (!rpcError && rpcData) {
        console.log("Subscription from RPC:", rpcData);
        return rpcData;
      }
    } catch (rpcErr) {
      console.error("RPC error:", rpcErr);
      // Continue to direct query if RPC fails
    }
    
    // Direct query as fallback
    const { data, error } = await supabase
      .from('user_balances')
      .select('subscription')
      .eq('id', session.user.id)
      .single();
      
    if (!error && data) {
      console.log("Subscription from direct query:", data.subscription);
      return data.subscription;
    }
    
    return null;
  } catch (error) {
    console.error("Error checking subscription:", error);
    return null;
  }
};

/**
 * Update subscription in localStorage and dispatch event
 */
export const updateLocalSubscription = async (subscription: string): Promise<boolean> => {
  try {
    console.log(`Updating local subscription to: ${subscription}`);
    
    // Set subscription in localStorage
    localStorage.setItem('subscription', subscription);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('subscription:updated', { 
      detail: { subscription } 
    }));
    
    // Show confirmation toast
    toast({
      title: "Abonnement mis à jour",
      description: `Votre abonnement ${subscription} a été activé avec succès.`,
      variant: "default",
    });
    
    return true;
  } catch (error) {
    console.error("Error updating local subscription:", error);
    return false;
  }
};

/**
 * Force synchronization of subscription data
 */
export const forceSyncSubscription = async (): Promise<boolean> => {
  try {
    console.log("Forçage de la synchronisation d'abonnement...");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return false;
    
    // Request a full refresh
    localStorage.setItem('forceRefreshBalance', 'true');
    
    const { data, error } = await supabase
      .from('user_balances')
      .select('subscription, balance')
      .eq('id', session.user.id)
      .single();
      
    if (!error && data) {
      console.log("Données synchronisées depuis Supabase:", data);
      
      localStorage.setItem('subscription', data.subscription);
      localStorage.setItem('currentBalance', data.balance?.toString() || '0');
      
      window.dispatchEvent(new CustomEvent('user:refreshed', {
        detail: { 
          subscription: data.subscription,
          balance: data.balance 
        }
      }));
      
      // Afficher une confirmation à l'utilisateur
      toast({
        title: "Synchronisation réussie",
        description: `Vos données ont été synchronisées. Abonnement actuel: ${data.subscription}`,
        variant: "default",
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error syncing subscription:", error);
    toast({
      title: "Erreur de synchronisation",
      description: "Nous avons rencontré un problème lors de la synchronisation de vos données.",
      variant: "destructive",
    });
    return false;
  }
};
