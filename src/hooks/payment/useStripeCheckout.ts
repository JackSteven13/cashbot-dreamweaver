
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from './types';
import { formatErrorMessage, updateLocalSubscription } from './utils';
import { useSubscriptionCheck } from './useSubscriptionCheck';
import { useStripeSession } from './useStripeSession';
import { useFreemiumUpdate } from './useFreemiumUpdate';

export const useStripeCheckout = (selectedPlan: PlanType | null) => {
  const navigate = useNavigate();
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [didInitiateRedirect, setDidInitiateRedirect] = useState(false);
  const redirectAttemptCount = useRef(0);
  
  const { actualSubscription, isChecking, recheckSubscription } = useSubscriptionCheck();
  const { stripeCheckoutUrl, createStripeSession, getEffectiveReferralCode } = useStripeSession();
  const { updateToFreemium } = useFreemiumUpdate();

  // Plus de redirection automatique - l'utilisateur doit explicitement cliquer sur le bouton
  useEffect(() => {
    if (stripeCheckoutUrl && isStripeProcessing && !didInitiateRedirect) {
      console.log("URL de paiement Stripe prête:", stripeCheckoutUrl);
      
      // Notification à l'utilisateur
      toast({
        title: "Page de paiement prête",
        description: "Cliquez sur le bouton vert pour accéder à la page de paiement Stripe.",
        duration: 10000,
      });
    }
  }, [stripeCheckoutUrl, isStripeProcessing, didInitiateRedirect]);

  const handleStripeCheckout = async () => {
    if (!selectedPlan) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un plan",
        variant: "destructive"
      });
      return;
    }

    // Vérifier à nouveau l'abonnement actuel
    const currentSub = await recheckSubscription();
    
    // Si l'utilisateur est déjà abonné à ce plan, afficher un message et rediriger
    if (currentSub === selectedPlan) {
      toast({
        title: "Abonnement déjà actif",
        description: `Vous êtes déjà abonné au forfait ${selectedPlan}. Vous allez être redirigé vers votre tableau de bord.`,
      });
      // Forcer une actualisation des données
      localStorage.setItem('forceRefreshBalance', 'true');
      navigate('/dashboard');
      return;
    }

    // Pour le plan gratuit, mettre à jour l'abonnement directement sans Stripe
    if (selectedPlan === 'freemium') {
      const success = await updateToFreemium();
      if (success) {
        navigate('/dashboard');
      }
      return;
    }

    if (isStripeProcessing) {
      console.log("Paiement déjà en cours");
      
      // Si nous avons déjà une URL et que l'utilisateur réessaie, reset le didInitiateRedirect
      if (stripeCheckoutUrl) {
        setDidInitiateRedirect(false);
        toast({
          title: "Page de paiement prête",
          description: "Cliquez sur le bouton vert pour accéder à la page de paiement Stripe.",
          duration: 6000,
        });
      }
      return;
    }
    
    console.log("Démarrage du processus de paiement Stripe pour le plan:", selectedPlan);
    setIsStripeProcessing(true);
    setDidInitiateRedirect(false);
    redirectAttemptCount.current = 0;

    try {
      // Obtenir la session utilisateur
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

      // Obtenir le code de parrainage du paramètre URL
      const effectiveReferralCode = getEffectiveReferralCode();
      console.log("Code de parrainage pour le paiement:", effectiveReferralCode || "aucun");
      
      // Mettre à jour localStorage par anticipation pour réduire le scintillement de l'interface
      localStorage.setItem('subscription', selectedPlan);
      
      // Forcer l'actualisation au retour au tableau de bord
      localStorage.setItem('forceRefreshBalance', 'true');
      
      // Créer et gérer la session de paiement Stripe
      const result = await createStripeSession(selectedPlan, effectiveReferralCode);
      console.log("Session Stripe créée:", result);
      
      if (!result || !result.url) {
        throw new Error("Impossible de créer la session de paiement");
      }

    } catch (error: any) {
      console.error("Erreur de paiement:", error);
      setIsStripeProcessing(false);
      setDidInitiateRedirect(false);
      
      // Gestion des erreurs spécifiques
      if (error.message && error.message.includes('SAME_PLAN')) {
        toast({
          title: "Abonnement déjà actif",
          description: "Vous êtes déjà abonné à ce forfait.",
          variant: "default"
        });
        navigate('/dashboard');
        return;
      }
      
      const errorMessage = formatErrorMessage(error);
      
      toast({
        title: "Erreur de paiement",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return {
    isStripeProcessing,
    handleStripeCheckout,
    actualSubscription,
    isChecking,
    stripeCheckoutUrl
  };
};
