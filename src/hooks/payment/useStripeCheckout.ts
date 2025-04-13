
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from './types';
import { formatErrorMessage, updateLocalSubscription } from './utils';
import { useSubscriptionCheck } from './useSubscriptionCheck';
import { useStripeSession } from './useStripeSession';
import { useFreemiumUpdate } from './useFreemiumUpdate';
import { openStripeWindow } from './stripeWindowManager';

/**
 * Hook pour gérer le processus de paiement Stripe
 */
export const useStripeCheckout = (selectedPlan: PlanType | null) => {
  const navigate = useNavigate();
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [didInitiateRedirect, setDidInitiateRedirect] = useState(false);
  const redirectAttemptCount = useRef(0);
  const maxAttempts = 3; // Nombre maximal de tentatives
  const processingTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const { actualSubscription, isChecking, recheckSubscription } = useSubscriptionCheck();
  const { stripeCheckoutUrl, createStripeSession, getEffectiveReferralCode } = useStripeSession();
  const { updateToFreemium } = useFreemiumUpdate();

  // Effet pour nettoyer le timeout à la sortie
  useEffect(() => {
    return () => {
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }
    };
  }, []);

  // Effet pour gérer l'URL de paiement prête
  useEffect(() => {
    if (stripeCheckoutUrl && isStripeProcessing && !didInitiateRedirect) {
      console.log("URL de paiement Stripe prête:", stripeCheckoutUrl);
      
      // Ouvrir directement la page Stripe au lieu d'attendre que l'utilisateur clique
      const opened = openStripeWindow(stripeCheckoutUrl);
      if (opened) {
        setDidInitiateRedirect(true);
        setIsStripeProcessing(false);
        toast({
          title: "Redirection vers Stripe",
          description: "Vous êtes redirigé vers la page de paiement sécurisée...",
          duration: 5000,
        });
      } else {
        // Si l'ouverture a échoué, informer l'utilisateur
        setIsStripeProcessing(false);
        toast({
          title: "Impossible d'ouvrir la page de paiement",
          description: "Veuillez cliquer sur le bouton pour accéder à la page de paiement",
          variant: "destructive",
          duration: 10000,
        });
      }
    }
  }, [stripeCheckoutUrl, isStripeProcessing, didInitiateRedirect]);

  // Fonction pour gérer le checkout Stripe
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
    try {
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
    } catch (err) {
      console.log("Erreur lors de la vérification de l'abonnement, on continue");
    }

    // Pour le plan gratuit, mettre à jour l'abonnement directement sans Stripe
    if (selectedPlan === 'freemium') {
      const success = await updateToFreemium();
      if (success) {
        navigate('/dashboard');
      }
      return;
    }

    if (isStripeProcessing && !stripeCheckoutUrl) {
      console.log("Paiement déjà en cours, attente...");
      
      // Si ça prend trop de temps, on réinitialise
      if (redirectAttemptCount.current >= maxAttempts) {
        toast({
          title: "Erreur de communication",
          description: "Le serveur de paiement ne répond pas. Veuillez réessayer.",
          variant: "destructive"
        });
        setIsStripeProcessing(false);
        redirectAttemptCount.current = 0;
      } else {
        redirectAttemptCount.current++;
      }
      return;
    }
    
    // Si nous avons déjà une URL et que l'utilisateur réessaie
    if (stripeCheckoutUrl) {
      console.log("Réutilisation de l'URL existante:", stripeCheckoutUrl);
      const opened = openStripeWindow(stripeCheckoutUrl);
      setDidInitiateRedirect(opened);
      if (!opened) {
        toast({
          title: "Impossible d'ouvrir la page de paiement",
          description: "Votre navigateur a bloqué la popup. Veuillez autoriser les popups pour ce site.",
          variant: "destructive"
        });
      }
      return;
    }
    
    console.log("Démarrage du processus de paiement Stripe pour le plan:", selectedPlan);
    setIsStripeProcessing(true);
    setDidInitiateRedirect(false);
    redirectAttemptCount.current = 0;

    // Mettre un timeout de sécurité pour réinitialiser si aucune réponse
    processingTimeout.current = setTimeout(() => {
      if (isStripeProcessing && !stripeCheckoutUrl) {
        console.log("Timeout du traitement du paiement");
        setIsStripeProcessing(false);
        toast({
          title: "Délai d'attente dépassé",
          description: "Le serveur de paiement n'a pas répondu dans le délai imparti. Veuillez réessayer.",
          variant: "destructive"
        });
      }
    }, 15000); // 15 secondes max pour obtenir une URL

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
      
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }
      
      if (!result || !result.url) {
        throw new Error("Impossible de créer la session de paiement");
      }
      
      // L'URL est prête, elle sera ouverte automatiquement par l'effet

    } catch (error: any) {
      console.error("Erreur de paiement:", error);
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }
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
