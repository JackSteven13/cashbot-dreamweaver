
/**
 * Utilitaires pour les paiements et synchronisations
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Force la synchronisation de l'abonnement avec Supabase
 * @returns true si la synchronisation est réussie
 */
export const forceSyncSubscription = async (): Promise<boolean> => {
  try {
    console.log("Forcer la synchronisation de l'abonnement");
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      console.error("Utilisateur non connecté lors de la synchronisation forcée");
      return false;
    }
    
    // Récupérer les données d'abonnement depuis Supabase
    const { data, error } = await supabase
      .from('user_balances')
      .select('subscription')
      .eq('id', session.user.id)
      .single();
      
    if (error) {
      console.error("Erreur lors de la récupération des données d'abonnement:", error);
      return false;
    }
    
    if (data && data.subscription) {
      // Mettre à jour le localStorage
      const currentSub = localStorage.getItem('subscription');
      
      console.log(`Synchronisation d'abonnement: ${currentSub || 'aucun'} -> ${data.subscription}`);
      await updateLocalSubscription(data.subscription);
      
      // Notifier les autres composants de la mise à jour
      window.dispatchEvent(new CustomEvent('user:refreshed', { 
        detail: { subscription: data.subscription }
      }));
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Erreur lors de la synchronisation forcée:", error);
    return false;
  }
};

/**
 * Vérifie l'abonnement actuel de l'utilisateur
 * @returns le type d'abonnement ou null
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
      console.error("Erreur lors de la récupération de l'abonnement:", error);
      return null;
    }
    
    return data.subscription;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'abonnement:", error);
    return null;
  }
};

/**
 * Met à jour l'abonnement dans le localStorage et notifie l'application
 * @param subscription le nouveau type d'abonnement
 */
export const updateLocalSubscription = async (subscription: string): Promise<void> => {
  if (!subscription) return;
  
  localStorage.setItem('subscription', subscription);
  
  // Mettre à jour le statut de l'abonnement dans l'application
  window.dispatchEvent(new CustomEvent('subscription:updated', {
    detail: { subscription }
  }));
  
  // Force la synchronisation des données utilisateur
  localStorage.setItem('forceRefreshBalance', 'true');
};

/**
 * Récupère une session de paiement à partir d'un ID de session
 * @param sessionId ID de session Stripe
 * @returns true si la session existe et est valide
 */
export const checkPaymentSession = async (sessionId: string): Promise<boolean> => {
  try {
    if (!sessionId) return false;
    
    const { data, error } = await supabase.functions.invoke('check-payment-status', {
      body: { sessionId }
    });
    
    if (error || !data) {
      console.error("Erreur lors de la vérification du statut de paiement:", error || "Aucune donnée");
      return false;
    }
    
    return data.status === 'complete';
  } catch (error) {
    console.error("Erreur lors de la vérification de la session:", error);
    return false;
  }
};

/**
 * Résout les problèmes courants de paiement mobile
 */
export const fixMobilePaymentIssues = async (): Promise<void> => {
  // Vérifier s'il y a un paiement en attente
  const pendingPayment = localStorage.getItem('pendingPayment') === 'true';
  const stripeUrl = localStorage.getItem('lastStripeUrl');
  
  if (pendingPayment && stripeUrl) {
    toast({
      title: "Paiement détecté",
      description: "Nous avons détecté un paiement en attente. Reprise de la procédure...",
      duration: 3000
    });
    
    // Effacer l'indicateur pour éviter des boucles de redirection
    localStorage.removeItem('pendingPayment');
    
    // Rediriger vers l'URL de paiement
    window.location.href = stripeUrl;
  }
};
