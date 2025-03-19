
import { useState, useEffect } from 'react';
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
        
        // Mise à jour via RPC
        try {
          const { error: rpcError } = await supabase
            .rpc('update_user_subscription', { 
              user_id: session.user.id, 
              new_subscription: selectedPlan 
            }) as { error: any };
            
          if (!rpcError) {
            console.log("Abonnement mis à jour avec succès via RPC");
          } else {
            // Si l'appel RPC échoue, essayer la méthode directe
            const { error } = await supabase
              .from('user_balances')
              .update({ 
                subscription: selectedPlan,
                updated_at: new Date().toISOString()
              })
              .eq('id', session.user.id);
              
            if (error) throw error;
          }
        } catch (error) {
          console.error("Error updating subscription:", error);
          
          // Dernière tentative - méthode directe
          const { error: directError } = await supabase
            .from('user_balances')
            .update({ 
              subscription: selectedPlan,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);
            
          if (directError) throw directError;
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

    setIsStripeProcessing(true);

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

      // Call Supabase Edge Function to create a Stripe checkout session
      console.log("Calling Stripe checkout for", selectedPlan, "plan", effectiveReferralCode ? `with referral: ${effectiveReferralCode}` : "without referral");
      
      const data = await createCheckoutSession(
        selectedPlan,
        `${window.location.origin}/payment-success`,
        `${window.location.origin}/offres`,
        effectiveReferralCode
      );
      
      // If it's a free plan, we're done
      if (data.free) {
        // Mettre à jour localStorage immédiatement
        await updateLocalSubscription(selectedPlan);
        
        // Forcer le rafraîchissement des données au retour sur le dashboard
        localStorage.setItem('forceRefreshBalance', 'true');
        
        toast({
          title: "Abonnement activé",
          description: `Votre abonnement ${selectedPlan} a été activé avec succès !`,
        });
        navigate('/payment-success');
        return;
      }
      
      // Update localStorage preemptively to reduce UI flicker
      localStorage.setItem('subscription', selectedPlan);
      
      // Force refresh on dashboard return
      localStorage.setItem('forceRefreshBalance', 'true');
      
      // Redirect to Stripe checkout URL
      if (data?.url) {
        console.log("Redirecting to Stripe checkout URL:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error("Aucune URL de paiement retournée");
      }

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
    isChecking
  };
};
