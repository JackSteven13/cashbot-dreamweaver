
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PlanType } from './types';
import { usePaymentProcessing } from './usePaymentProcessing';
import { useStripeCheckout } from './useStripeCheckout';
import { useSubscriptionSync } from './useSubscriptionSync';

export const usePaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [useStripePayment, setUseStripePayment] = useState(true); // Toujours utiliser Stripe par défaut
  
  // Get the processing state from the payment hooks
  const { isProcessing, processPayment } = usePaymentProcessing(selectedPlan);
  const { 
    isStripeProcessing, 
    handleStripeCheckout, 
    stripeCheckoutUrl 
  } = useStripeCheckout(selectedPlan);
  
  // Synchronisation de l'abonnement
  const { subscription: currentSubscription, syncSubscription } = useSubscriptionSync();

  // Extract plan from state or URL params
  useEffect(() => {
    const extractPlanFromRouting = async () => {
      let plan: string | null = null;
      
      if (location.state && location.state.plan) {
        plan = location.state.plan;
        console.log("Plan from state:", plan);
      } else {
        plan = new URLSearchParams(location.search).get('plan');
        console.log("Plan from URL params:", plan);
      }
      
      // Si aucun plan n'est spécifié, essayer de récupérer depuis localStorage
      if (!plan) {
        const storedPlan = localStorage.getItem('selected_plan');
        if (storedPlan) {
          plan = storedPlan;
          console.log("Plan from localStorage:", plan);
        }
      } else {
        // Stocker le plan sélectionné pour la persistance
        localStorage.setItem('selected_plan', plan);
      }
      
      console.log("Payment page initialized with plan:", plan);
      
      // Vérifier si l'utilisateur est déjà abonné à ce plan
      if (plan === currentSubscription) {
        console.log(`L'utilisateur est déjà abonné au plan ${plan}`);
        toast({
          title: "Abonnement déjà actif",
          description: `Vous êtes déjà abonné au forfait ${plan}. Redirection vers le tableau de bord.`,
          duration: 5000
        });
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }
      
      // Rediriger les utilisateurs freemium vers le tableau de bord ou les offres
      if (plan === 'freemium') {
        await handleFreemiumSubscription();
        return;
      }
      
      if (plan && ['starter', 'gold', 'elite'].includes(plan)) {
        setSelectedPlan(plan as PlanType);
      } else {
        // Si aucun plan valide n'est spécifié, rediriger vers les offres
        toast({
          title: "Plan non valide",
          description: "Veuillez sélectionner un plan valide.",
          variant: "destructive"
        });
        navigate('/offres');
      }
    };

    extractPlanFromRouting();
  }, [location, navigate, currentSubscription]);

  // Vérifier si l'utilisateur est authentifié
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Accès refusé",
            description: "Vous devez être connecté pour souscrire à un abonnement.",
            variant: "destructive"
          });
          // Stocker le plan pour le récupérer après connexion
          if (selectedPlan) {
            localStorage.setItem('selected_plan', selectedPlan);
          }
          navigate('/login');
          return;
        }
        
        // Synchroniser l'abonnement après la vérification d'authentification
        await syncSubscription(true);
        setIsAuthChecking(false);
      } catch (error) {
        console.error("Authentication error:", error);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier votre session. Veuillez vous reconnecter.",
          variant: "destructive"
        });
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [navigate, selectedPlan, syncSubscription]);

  // Gérer l'abonnement Freemium
  const handleFreemiumSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Tenter d'abord avec une fonction RPC
        try {
          const { error: rpcError } = await supabase
            .rpc('update_user_subscription', { 
              user_id: session.user.id, 
              new_subscription: 'freemium' 
            }) as { error: any };
            
          if (rpcError) throw rpcError;
          
          console.log("Abonnement mis à jour avec succès via RPC");
        } catch (rpcError) {
          console.error("Erreur RPC:", rpcError);
          
          // Fallback sur méthode directe
          const { error } = await supabase
            .from('user_balances')
            .update({ 
              subscription: 'freemium',
              updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);
            
          if (error) throw error;
        }
        
        localStorage.setItem('subscription', 'freemium');
        
        toast({
          title: "Abonnement Freemium activé !",
          description: "Vous bénéficiez maintenant des avantages du forfait Freemium.",
        });
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de votre abonnement.",
        variant: "destructive"
      });
      navigate('/offres');
    }
  };

  // Fonction preservée pour la compatibilité mais n'est plus utilisée dans l'interface
  const togglePaymentMethod = () => {
    setUseStripePayment(!useStripePayment);
  };

  const initiateStripeCheckout = () => {
    console.log("Initiating Stripe checkout from Payment page");
    try {
      handleStripeCheckout();
    } catch (error) {
      console.error("Error initiating Stripe checkout:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du paiement. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  return {
    selectedPlan,
    isAuthChecking,
    useStripePayment,
    isProcessing,
    isStripeProcessing,
    stripeCheckoutUrl,
    togglePaymentMethod,
    handleCardFormSubmit: processPayment,
    initiateStripeCheckout,
    currentSubscription
  };
};
