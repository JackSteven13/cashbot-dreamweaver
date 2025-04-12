
import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { PlanType } from './types';
import { openStripeWindow } from './stripeWindowManager';
import { toast } from "@/components/ui/use-toast";

/**
 * Hook pour gérer la session de paiement Stripe
 * avec une gestion améliorée des erreurs et des retries
 */
export const useStripeSession = () => {
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);
  const location = useLocation();
  
  // Récupérer le code de parrainage des paramètres d'URL ou du localStorage
  const getEffectiveReferralCode = useCallback((): string | null => {
    // Vérifier d'abord dans l'URL
    const params = new URLSearchParams(location.search);
    const referralCode = params.get('ref');
    
    if (referralCode) {
      console.log("Code de parrainage trouvé dans l'URL:", referralCode);
      
      // Sauvegarder pour une utilisation ultérieure
      localStorage.setItem('referralCode', referralCode);
      return referralCode;
    }
    
    // Sinon, essayer de récupérer depuis localStorage
    const savedCode = localStorage.getItem('referralCode');
    if (savedCode) {
      console.log("Code de parrainage récupéré du localStorage:", savedCode);
      return savedCode;
    }
    
    return null;
  }, [location]);
  
  // Créer une session Stripe avec retry en cas d'erreur
  const createStripeSession = useCallback(
    async (
      selectedPlan: PlanType, 
      referralCode: string | null = null,
      maxRetries: number = 3
    ): Promise<{ url: string } | null> => {
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`Création d'une session de paiement pour ${selectedPlan}`);
          
          // Préparer l'URL de succès et d'annulation
          const successUrl = `${window.location.origin}/payment-success`;
          const cancelUrl = `${window.location.origin}/offres`;
          
          console.log("Success URL:", successUrl);
          console.log("Cancel URL:", cancelUrl);
          
          // Appel à la fonction Edge
          const { data, error } = await supabase.functions.invoke('create-checkout', {
            body: {
              plan: selectedPlan,
              successUrl,
              cancelUrl,
              referralCode
            }
          });
          
          if (error) {
            throw new Error(`Erreur d'invocation de la fonction: ${error.message}`);
          }
          
          if (!data?.url) {
            throw new Error(`Aucune URL retournée: ${JSON.stringify(data)}`);
          }
          
          // Stocker l'URL pour une utilisation ultérieure
          setStripeCheckoutUrl(data.url);
          localStorage.setItem('stripeCheckoutUrl', data.url);
          
          return data;
        } catch (error) {
          retryCount++;
          console.error(`Erreur lors de l'invocation de la fonction create-checkout:`, error);
          
          // Afficher un message différent selon le nombre de tentatives
          if (retryCount < maxRetries) {
            console.log(`Retrying (${retryCount}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            // Afficher un toast d'erreur après la dernière tentative
            toast({
              title: "Erreur de paiement",
              description: "Le serveur de paiement ne répond pas. Veuillez réessayer plus tard.",
              variant: "destructive"
            });
            
            throw new Error("Une erreur est survenue lors de la création de la session de paiement.");
          }
        }
      }
      
      return null;
    },
    []
  );
  
  // Ouvrir directement la session Stripe
  const openStripeSession = useCallback((url: string): boolean => {
    return openStripeWindow(url);
  }, []);
  
  return {
    stripeCheckoutUrl,
    createStripeSession,
    openStripeSession,
    getEffectiveReferralCode
  };
};
