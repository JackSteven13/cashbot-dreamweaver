
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from './types';
import { 
  getReferralCodeFromURL, 
  formatErrorMessage, 
  updateLocalSubscription,
  checkCurrentSubscription
} from './utils';
import { createCheckoutSession } from './paymentService';

export const useStripeCheckout = (selectedPlan: PlanType | null) => {
  const navigate = useNavigate();
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [actualSubscription, setActualSubscription] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Vérifier l'abonnement actuel depuis Supabase au chargement
  useEffect(() => {
    const verifyCurrentSubscription = async () => {
      setIsChecking(true);
      const currentSub = await checkCurrentSubscription();
      if (currentSub) {
        setActualSubscription(currentSub);
        console.log("Abonnement vérifié depuis Supabase:", currentSub);
        
        // Mettre à jour le localStorage si nécessaire
        const localSub = localStorage.getItem('subscription');
        if (localSub !== currentSub) {
          console.log(`Mise à jour du localStorage : ${localSub} -> ${currentSub}`);
          localStorage.setItem('subscription', currentSub);
        }
      }
      setIsChecking(false);
    };
    
    verifyCurrentSubscription();
  }, []);

  // Effet pour ouvrir la page Stripe dès que l'URL est disponible
  useEffect(() => {
    if (stripeCheckoutUrl) {
      // Ouvrir l'URL de Stripe dans une nouvelle fenêtre ou onglet
      console.log("Ouverture de l'URL Stripe:", stripeCheckoutUrl);
      
      const openStripeWindow = () => {
        // Essayer d'ouvrir dans un nouvel onglet d'abord
        const newWindow = window.open(stripeCheckoutUrl, '_blank');
        
        // Si l'ouverture dans un nouvel onglet échoue (bloqueurs de popups), rediriger la fenêtre actuelle
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          console.log("Impossible d'ouvrir dans un nouvel onglet, redirection de la fenêtre actuelle");
          window.location.href = stripeCheckoutUrl;
        }
      };
      
      // Première tentative immédiate
      openStripeWindow();
      
      // Si toujours en traitement après 2 secondes, proposer un bouton visible
      const timeoutId = setTimeout(() => {
        if (isStripeProcessing) {
          toast({
            title: "Paiement en attente",
            description: "Utilisez le bouton ci-dessous si la page de paiement ne s'est pas ouverte automatiquement.",
            action: {
              altText: "Ouvrir le paiement",
              onClick: openStripeWindow,
              className: "bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md cursor-pointer text-sm",
              children: "Ouvrir le paiement"
            }
          });
        }
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [stripeCheckoutUrl, isStripeProcessing]);

  // Fonction pour créer une session de checkout
  const createStripeSession = useCallback(async (plan: PlanType, referralCode: string | null) => {
    try {
      console.log(`Création d'une session Stripe pour le plan ${plan}${referralCode ? ` avec code parrain ${referralCode}` : ''}`);
      
      const data = await createCheckoutSession(
        plan,
        `${window.location.origin}/payment-success`,
        `${window.location.origin}/offres`,
        referralCode
      );
      
      if (data?.url) {
        console.log("URL de checkout Stripe obtenue:", data.url);
        setStripeCheckoutUrl(data.url);
        return { success: true, url: data.url };
      } else {
        throw new Error("Aucune URL de paiement retournée");
      }
    } catch (error) {
      console.error("Erreur lors de la création de la session Stripe:", error);
      if (retryCount < 2) {
        console.log(`Nouvelle tentative (${retryCount + 1}/3)...`);
        setRetryCount(retryCount + 1);
        // Petite attente avant la nouvelle tentative
        await new Promise(resolve => setTimeout(resolve, 1000));
        return createStripeSession(plan, referralCode);
      }
      throw error;
    }
  }, [retryCount]);

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
    const currentSub = await checkCurrentSubscription();
    
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

    // Pour freemium, update subscription directement sans Stripe
    if (selectedPlan === 'freemium') {
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
        
        // Mise à jour via RPC qui est plus fiable
        try {
          const { error: rpcError } = await supabase
            .rpc('update_user_subscription', { 
              user_id: session.user.id, 
              new_subscription: selectedPlan 
            }) as { error: any };
            
          if (rpcError) throw rpcError;
          
          console.log("Abonnement mis à jour avec succès via RPC");
        } catch (rpcCatchError) {
          console.error("Erreur RPC:", rpcCatchError);
          
          // Fallback sur méthode directe
          const { error: updateError } = await supabase
            .from('user_balances')
            .update({ 
              subscription: selectedPlan,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);
            
          if (updateError) throw updateError;
        }
        
        // Mettre à jour localStorage immédiatement
        await updateLocalSubscription(selectedPlan);
        
        // Forcer le rafraîchissement des données au retour sur le dashboard
        localStorage.setItem('forceRefreshBalance', 'true');
        
        toast({
          title: "Abonnement Freemium activé",
          description: "Votre abonnement Freemium a été activé avec succès !",
        });
        
        navigate('/dashboard');
        return;
      } catch (error) {
        console.error("Error updating subscription:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'activation de votre abonnement.",
          variant: "destructive"
        });
        return;
      }
    }

    if (isStripeProcessing) {
      console.log("Paiement déjà en cours, utilisation de l'URL stockée si disponible");
      if (stripeCheckoutUrl) {
        const newWindow = window.open(stripeCheckoutUrl, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.replace(stripeCheckoutUrl);
        }
      }
      return;
    }
    
    setIsStripeProcessing(true);
    setRetryCount(0);

    try {
      // Get user session
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

      // Get referral code from URL parameter
      const effectiveReferralCode = getReferralCodeFromURL();
      
      // Update localStorage preemptively to reduce UI flicker
      localStorage.setItem('subscription', selectedPlan);
      
      // Force refresh on dashboard return
      localStorage.setItem('forceRefreshBalance', 'true');
      
      // Create and handle Stripe checkout session
      await createStripeSession(selectedPlan, effectiveReferralCode);

    } catch (error: any) {
      console.error("Payment error:", error);
      setIsStripeProcessing(false);
      
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
    stripeCheckoutUrl  // Export l'URL pour permettre la redirection manuelle
  };
};
