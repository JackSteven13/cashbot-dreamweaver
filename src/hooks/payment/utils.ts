
import { toast } from "@/components/ui/use-toast";
import { PlanType } from "./types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Récupère le code de parrainage à partir de l'URL
 */
export const getReferralCodeFromURL = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref');
};

/**
 * Formatte un message d'erreur de paiement pour l'utilisateur
 */
export const formatErrorMessage = (error: any): string => {
  // Check for specific error patterns
  if (error.message?.includes('No such price')) {
    return "La configuration des prix n'est pas encore terminée. Veuillez réessayer ultérieurement.";
  } else if (error.message?.includes('Invalid API Key')) {
    return "Configuration de paiement incorrecte. Veuillez contacter le support.";
  } else if (error.message?.includes('Edge Function returned a non-2xx status code')) {
    return "Le service de paiement est temporairement indisponible. Veuillez réessayer dans quelques instants.";
  } else if (error.message?.includes('product exists in live mode, but a test mode key was used')) {
    return "Système en cours de migration vers la production. Merci de réessayer dans quelques minutes.";
  } else if (error.message?.includes('Converting circular structure to JSON')) {
    return "Erreur technique dans le format de la requête. Veuillez réessayer.";
  } else if (error.message?.includes('Invalid integer')) {
    return "Erreur de formatage du prix. Notre équipe a été informée et résoudra ce problème rapidement.";
  } else if (error.message?.includes('already subscribed')) {
    return "Vous êtes déjà abonné à ce forfait. Rafraîchissez la page pour voir votre abonnement actuel.";
  }
  
  // Use the original error message or a generic one
  return error.message || "Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.";
};

/**
 * Met à jour l'abonnement à la fois dans localStorage et vérifie avec Supabase
 */
export const updateLocalSubscription = async (subscription: PlanType): Promise<void> => {
  // Mise à jour immédiate dans localStorage
  localStorage.setItem('subscription', subscription);
  console.log(`Abonnement mis à jour localement: ${subscription}`);
  
  // Signaler qu'une actualisation forcée est nécessaire au retour sur le dashboard
  localStorage.setItem('forceRefreshBalance', 'true');
  
  try {
    // Vérifier si la mise à jour est correctement enregistrée dans Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Attendre un court délai pour que la base de données ait le temps de se mettre à jour
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Vérifier que l'abonnement est bien mis à jour dans Supabase
      const { data: userBalance, error } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', session.user.id)
        .single();
      
      if (!error && userBalance) {
        if (userBalance.subscription !== subscription) {
          console.warn(`Désynchronisation détectée: Supabase (${userBalance.subscription}) vs Local (${subscription})`);
          
          // Tentative de mise à jour directe
          const { error: updateError } = await supabase
            .from('user_balances')
            .update({ 
              subscription: subscription,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);
            
          if (updateError) {
            console.error("Erreur lors de la correction de la désynchronisation:", updateError);
            
            // Tenter une mise à jour via RPC si la méthode directe échoue
            try {
              const { error: rpcError } = await supabase
                .rpc('update_user_subscription', { 
                  user_id: session.user.id, 
                  new_subscription: subscription 
                });
                
              if (!rpcError) {
                console.log("Synchronisation corrigée avec succès via RPC");
              } else {
                console.error("Erreur RPC:", rpcError);
              }
            } catch (rpcErr) {
              console.error("Erreur RPC:", rpcErr);
            }
          } else {
            console.log("Synchronisation corrigée avec succès");
          }
        } else {
          console.log("Synchronisation vérifiée: abonnement cohérent entre Supabase et localStorage");
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de synchronisation:", error);
  }
};

/**
 * Valide les informations de carte bancaire
 */
export const validateCardPayment = (
  cardNumber: string,
  expiry: string,
  cvc: string
): boolean => {
  let isValid = true;
  
  // Validation simplifiée du numéro de carte
  if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
    toast({
      title: "Numéro de carte invalide",
      description: "Veuillez saisir un numéro de carte valide",
      variant: "destructive"
    });
    isValid = false;
  }
  
  // Validation simplifiée de la date d'expiration
  if (!expiry || !expiry.includes('/')) {
    toast({
      title: "Date d'expiration invalide",
      description: "Veuillez saisir une date d'expiration valide (MM/AA)",
      variant: "destructive"
    });
    isValid = false;
  }
  
  // Validation simplifiée du CVC
  if (!cvc || cvc.length < 3) {
    toast({
      title: "CVC invalide",
      description: "Veuillez saisir un code de sécurité valide",
      variant: "destructive"
    });
    isValid = false;
  }
  
  return isValid;
};

/**
 * Vérifie l'abonnement actuel de l'utilisateur directement depuis Supabase
 */
export const checkCurrentSubscription = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log("Pas de session utilisateur pour vérifier l'abonnement");
      return null;
    }
    
    console.log("Vérification de l'abonnement actuel pour:", session.user.id);
    
    // Récupérer l'abonnement actuel en contournant le cache
    const { data, error } = await supabase
      .from('user_balances')
      .select('subscription')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error("Erreur lors de la vérification de l'abonnement:", error);
      return null;
    }
    
    console.log("Abonnement actuel selon Supabase:", data.subscription);
    return data.subscription;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'abonnement:", error);
    return null;
  }
};
