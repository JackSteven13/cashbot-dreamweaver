
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Formate un message d'erreur pour l'affichage
 */
export const formatErrorMessage = (error: any): string => {
  if (!error) return "Une erreur inconnue est survenue";

  // Si c'est une erreur de type Error
  if (error instanceof Error) {
    const message = error.message;
    
    // Gestion des messages d'erreur spécifiques
    if (message.includes('SAME_PLAN')) {
      return "Vous êtes déjà abonné à ce forfait.";
    }
    if (message.includes('not authenticated')) {
      return "Vous devez être connecté pour effectuer cette action.";
    }
    if (message.includes('timeout')) {
      return "La connexion au serveur de paiement a expiré. Veuillez réessayer.";
    }
    
    return message;
  }
  
  // Si c'est une erreur de type string
  if (typeof error === 'string') {
    return error;
  }
  
  // Si c'est une erreur avec un message
  if (error.message) {
    return error.message;
  }
  
  // Fallback
  return "Une erreur inattendue est survenue. Veuillez réessayer.";
};

/**
 * Met à jour localement les informations d'abonnement
 */
export const updateLocalSubscription = (subscription: string) => {
  localStorage.setItem('subscription', subscription);
  localStorage.setItem('subscriptionUpdateTime', Date.now().toString());
  
  // Dispatch un événement pour informer l'application du changement d'abonnement
  window.dispatchEvent(new CustomEvent('subscription:updated', {
    detail: { subscription }
  }));
  
  console.log(`Abonnement local mis à jour: ${subscription}`);
  return true;
};

/**
 * Vérifie si l'utilisateur est connecté
 */
export const checkUserAuthenticated = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    return !!data.session;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'authentification:", error);
    return false;
  }
};

/**
 * Récupère l'ID utilisateur actuel
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      return null;
    }
    
    return data.session.user.id;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'ID utilisateur:", error);
    return null;
  }
};

/**
 * Gère les erreurs de paiement et les affiche à l'utilisateur
 */
export const handlePaymentError = (error: any): void => {
  const errorMessage = formatErrorMessage(error);
  
  toast({
    title: "Erreur de paiement",
    description: errorMessage,
    variant: "destructive",
    duration: 7000,
  });
  
  console.error("Erreur de paiement détaillée:", error);
};
