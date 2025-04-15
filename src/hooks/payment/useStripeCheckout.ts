
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from './types';
import { openStripeWindow } from './stripeWindowManager';
import { forceSyncSubscription } from './utils';

export const useStripeCheckout = (selectedPlan: PlanType | null) => {
  const navigate = useNavigate();
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [actualSubscription, setActualSubscription] = useState<string | null>(null);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000;

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

  // Fonction pour vérifier l'état de la session de paiement
  const checkPaymentStatus = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!sessionId) return false;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { sessionId }
      });
      
      if (error) {
        console.error("Error checking payment status:", error);
        return false;
      }
      
      if (data?.status === 'complete') {
        toast({
          title: "Paiement confirmé",
          description: "Votre abonnement a été activé avec succès. Synchronisation des données...",
          duration: 5000,
        });
        
        // Forcer la synchronisation des données
        await forceSyncSubscription();
        
        // Dispatch event for subscription changes
        window.dispatchEvent(new CustomEvent('payment:success', { 
          detail: { plan: data.plan || selectedPlan }
        }));
        
        // Rediriger vers la page de succès
        navigate('/payment-success');
        return true;
      } else if (data?.status === 'open') {
        toast({
          title: "Paiement en attente",
          description: "Votre paiement est en cours de traitement. Veuillez compléter la procédure.",
          duration: 5000,
        });
        return false;
      }
      
      return false;
    } catch (e) {
      console.error("Error verifying payment:", e);
      return false;
    }
  }, [navigate, selectedPlan]);

  // Création d'une session de paiement Stripe avec mécanismes de sécurité améliorés
  const createCheckoutSession = async (): Promise<{ url: string, sessionId: string } | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Vous devez être connecté pour effectuer cette action");
      }

      console.log(`Création d'une session de paiement pour ${selectedPlan}`);
      
      // Paramètres supplémentaires pour une meilleure compatibilité mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // On the challenge page, make sure to always force the URL to be absolute and use the production URL
      const origin = window.location.origin;
      const successUrl = `${origin}/payment-success`;
      const cancelUrl = `${origin}/offres`;
      
      console.log("URLs de redirection:", { successUrl, cancelUrl });
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          plan: selectedPlan,
          successUrl,
          cancelUrl,
          mobile: isMobile // Indiquer si nous sommes sur mobile
        }
      });
      
      if (error) {
        throw new Error(`Erreur d'invocation: ${error.message}`);
      }
      
      if (!data?.url) {
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
      let lastError = null;
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          console.log(`Tentative ${attempt + 1} de création de session de paiement pour ${selectedPlan}`);
          
          const result = await createCheckoutSession();
          
          if (result && result.url) {
            // Stocker l'URL et l'ID de session pour utilisation ultérieure
            setStripeCheckoutUrl(result.url);
            setCheckoutSessionId(result.sessionId);
            
            // Sauvegarder dans localStorage pour récupération éventuelle
            localStorage.setItem('lastStripeUrl', result.url);
            localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
            localStorage.setItem('pendingPayment', 'true');
            
            // Notification de succès
            toast({
              title: "Redirection vers le paiement",
              description: "Préparation de votre session de paiement sécurisée...",
              duration: 3000,
            });
            
            return;
          }
        } catch (err) {
          console.error(`Erreur lors de la tentative ${attempt + 1}:`, err);
          lastError = err;
          
          // Si ce n'est pas la dernière tentative, attendre avant de réessayer
          if (attempt < MAX_RETRIES - 1) {
            setRetryCount(attempt + 1);
            // Utiliser un délai exponentiel
            const delay = RETRY_DELAY * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // Si nous avons épuisé toutes nos tentatives
      throw lastError || new Error("Impossible de créer une session de paiement après plusieurs tentatives");

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

  // Ouvrir la fenêtre Stripe manuellement
  const openStripeCheckoutWindow = useCallback(() => {
    if (stripeCheckoutUrl) {
      return openStripeWindow(stripeCheckoutUrl);
    }
    return false;
  }, [stripeCheckoutUrl]);
  
  // Récupérer l'URL Stripe depuis le stockage de session si disponible
  useEffect(() => {
    const storedUrl = sessionStorage.getItem('stripeCheckoutUrl');
    const timestamp = parseInt(sessionStorage.getItem('stripeSessionTimestamp') || '0', 10);
    // Utiliser l'URL stockée si elle a moins de 15 minutes
    if (storedUrl && Date.now() - timestamp < 15 * 60 * 1000) {
      setStripeCheckoutUrl(storedUrl);
    }
    
    // Vérifier s'il y a un paiement en cours
    if (localStorage.getItem('pendingPayment') === 'true') {
      const lastUrl = localStorage.getItem('lastStripeUrl');
      if (lastUrl) {
        setStripeCheckoutUrl(lastUrl);
      }
    }
  }, []);
  
  // Stocker l'URL Stripe dans le stockage de session pour récupération
  useEffect(() => {
    if (stripeCheckoutUrl) {
      sessionStorage.setItem('stripeCheckoutUrl', stripeCheckoutUrl);
      sessionStorage.setItem('stripeSessionTimestamp', Date.now().toString());
    }
  }, [stripeCheckoutUrl]);

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
    openStripeCheckoutWindow,
    retryCount
  };
};
