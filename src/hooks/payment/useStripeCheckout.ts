
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from './types';
import { openStripeWindow } from './stripeWindowManager';

export const useStripeCheckout = (selectedPlan: PlanType | null) => {
  const navigate = useNavigate();
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [actualSubscription, setActualSubscription] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 800;

  // Check current subscription from Supabase
  const checkSubscription = async () => {
    setIsChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('user_balances')
          .select('subscription')
          .eq('id', session.user.id)
          .single();
          
        if (!error && data) {
          setActualSubscription(data.subscription);
          return data.subscription;
        }
      }
      return null;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  // Création d'une session de paiement Stripe avec mécanismes de sécurité améliorés
  const createCheckoutSession = async (): Promise<{ url: string, sessionId: string } | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Vous devez être connecté pour effectuer cette action");
      }

      console.log(`Création d'une session de paiement pour ${selectedPlan}`);
      
      // On the challenge page, make sure to always force the URL to be absolute
      const origin = window.location.origin;
      const successUrl = `${origin}/payment-success`;
      const cancelUrl = `${origin}/offres`;
      
      console.log("URLs de redirection:", { successUrl, cancelUrl });
      
      // Appel à la fonction Edge avec plus de détails dans la requête
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          plan: selectedPlan,
          successUrl,
          cancelUrl,
          timestamp: Date.now() // Ajouter un timestamp pour éviter les problèmes de cache
        }
      });
      
      if (error) {
        console.error("Erreur d'invocation:", error);
        throw new Error(`Erreur d'invocation: ${error.message}`);
      }
      
      if (!data?.url) {
        console.error("Aucune URL retournée:", data);
        throw new Error("Aucune URL de paiement générée");
      }
      
      console.log("URL de paiement obtenue:", data.url);
      
      // Extraire l'ID de session de l'URL
      const sessionId = data.url.split('/').pop()?.split('#')[0] || null;
      
      return {
        url: data.url,
        sessionId: sessionId || ''
      };
    } catch (err) {
      console.error("Erreur lors de la création de session:", err);
      throw err;
    }
  };

  const handleStripeCheckout = async () => {
    if (!selectedPlan) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un plan",
        variant: "destructive"
      });
      return;
    }

    setIsStripeProcessing(true);
    setRetryCount(0);
    setStripeCheckoutUrl(null);

    try {
      // Authentification de l'utilisateur et vérification
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour effectuer cette action",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      // Essayer de créer une session de paiement avec des tentatives
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          console.log(`Tentative ${attempt + 1} de création de session de paiement`);
          
          const result = await createCheckoutSession();
          
          if (result && result.url) {
            // Stocker l'URL et l'ID de session
            setStripeCheckoutUrl(result.url);
            
            // Sauvegarder dans localStorage pour récupération éventuelle
            localStorage.setItem('lastStripeUrl', result.url);
            localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
            localStorage.setItem('pendingPayment', 'true');
            
            // Retourner avec succès
            return;
          }
        } catch (err) {
          console.error(`Erreur lors de la tentative ${attempt + 1}:`, err);
          
          // Si ce n'est pas la dernière tentative, attendre avant de réessayer
          if (attempt < MAX_RETRIES - 1) {
            setRetryCount(attempt + 1);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          } else {
            throw err; // Relancer l'erreur après la dernière tentative
          }
        }
      }
      
      throw new Error("Impossible de créer une session de paiement après plusieurs tentatives");

    } catch (error: any) {
      console.error("Erreur de paiement:", error);
      
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue lors de la préparation du paiement. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsStripeProcessing(false);
    }
  };
  
  // Vérifier l'abonnement au chargement du hook
  useEffect(() => {
    checkSubscription();
  }, []);

  return {
    isStripeProcessing,
    handleStripeCheckout,
    stripeCheckoutUrl,
    isChecking,
    actualSubscription,
    retryCount
  };
};
