
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
  const MAX_RETRIES = 3;

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

  // Fonction améliorée pour vérifier l'état de la session de paiement
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
      const attemptCreateCheckout = async (): Promise<any> => {
        try {
          const { data, error } = await supabase.functions.invoke('create-checkout', {
            body: {
              plan: selectedPlan,
              successUrl: `${window.location.origin}/payment-success`,
              cancelUrl: `${window.location.origin}/offres`,
              blockTestCards: true
            }
          });
          
          if (error) throw new Error(error.message);
          return { data };
        } catch (err) {
          console.error("Erreur lors de la création de la session:", err);
          if (retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
            return attemptCreateCheckout();
          }
          throw err;
        }
      };

      const { data } = await attemptCreateCheckout();

      if (!data?.url) {
        throw new Error("Impossible de créer la session de paiement");
      }

      console.log("URL de paiement obtenue:", data.url);
      
      // Stocker l'URL pour redirection
      setStripeCheckoutUrl(data.url);
      
      // Pas besoin de rediriger ici, la redirection se fait dans le useEffect du PaymentCard

    } catch (error: any) {
      console.error("Erreur de paiement:", error);
      setIsStripeProcessing(false);
      
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue lors de la préparation du paiement. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  // Open Stripe checkout window manually if needed
  const openStripeCheckoutWindow = useCallback(() => {
    if (stripeCheckoutUrl) {
      try {
        window.location.href = stripeCheckoutUrl;
        return true;
      } catch (error) {
        console.error("Erreur lors de la redirection:", error);
        return false;
      }
    }
    return false;
  }, [stripeCheckoutUrl]);

  // Check subscription when the hook is initialized
  useEffect(() => {
    checkSubscription();
  }, []);

  return {
    isStripeProcessing,
    handleStripeCheckout,
    stripeCheckoutUrl,
    isChecking,
    actualSubscription,
    openStripeCheckoutWindow
  };
};
