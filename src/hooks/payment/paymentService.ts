
import { supabase } from "@/integrations/supabase/client";
import { PlanType } from './types';
import { toast } from "@/components/ui/use-toast";

/**
 * Crée une session de paiement Stripe via Edge Function
 * @param plan Le plan d'abonnement sélectionné
 * @param successUrl URL de redirection après succès
 * @param cancelUrl URL de redirection après annulation
 * @param referralCode Code de parrainage optionnel
 */
export const createCheckoutSession = async (
  plan: PlanType,
  successUrl: string,
  cancelUrl: string,
  referralCode: string | null
) => {
  console.log(`Création d'une session de paiement pour ${plan}`);
  
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        plan,
        successUrl,
        cancelUrl,
        referralCode,
        timestamp: Date.now() // Ajout d'un timestamp pour éviter les problèmes de cache
      }
    });

    if (error) {
      console.error("Erreur lors de l'invocation de la fonction create-checkout:", error);
      let errorMessage = "Une erreur est survenue lors de la création de la session de paiement.";
      
      // Enrichir le message d'erreur si possible
      if (error.message) {
        if (error.message.includes("SAME_PLAN")) {
          errorMessage = "Vous êtes déjà abonné à ce forfait.";
        } else if (error.message.includes("not authenticated")) {
          errorMessage = "Vous devez être connecté pour effectuer cette action.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "La connexion au serveur de paiement a expiré. Veuillez réessayer.";
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw new Error(errorMessage);
    }

    if (!data?.url) {
      console.error("Aucune URL retournée par la fonction create-checkout");
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement. Veuillez réessayer.",
        variant: "destructive",
      });
      
      throw new Error("Aucune URL de paiement retournée");
    }

    console.log("URL de paiement obtenue:", data.url);
    return data;
  } catch (error) {
    console.error("Erreur lors de la création de la session de paiement:", error);
    
    // Ne pas afficher de toast ici car déjà géré plus haut
    throw error;
  }
};
