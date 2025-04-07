
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStripeCheckout } from './useStripeCheckout';
import { usePaymentProcessing } from './usePaymentProcessing';
import { PaymentFormData, PlanType } from './types';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const usePaymentPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [useStripePayment, setUseStripePayment] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { isStripeProcessing, handleStripeCheckout, stripeCheckoutUrl } = useStripeCheckout(selectedPlan);
  const { isProcessing, processPayment } = usePaymentProcessing(selectedPlan);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Authentification requise",
            description: "Veuillez vous connecter pour continuer.",
            variant: "destructive"
          });
          
          navigate('/login', { state: { returnTo: location.pathname + location.search } });
          return;
        }
        
        // Extraire le plan sélectionné depuis les paramètres d'URL
        const params = new URLSearchParams(location.search);
        const planFromUrl = params.get('plan') as PlanType | null;
        
        if (!planFromUrl || !['starter', 'gold', 'elite', 'freemium'].includes(planFromUrl)) {
          toast({
            title: "Plan invalide",
            description: "Veuillez sélectionner un plan valide.",
            variant: "destructive"
          });
          
          navigate('/offres');
          return;
        }
        
        // Récupérer l'abonnement actuel de l'utilisateur
        const { data: userData, error } = await supabase
          .from('user_balances')
          .select('subscription')
          .eq('id', session.user.id)
          .single();
          
        if (!error && userData) {
          setCurrentSubscription(userData.subscription);
          
          // Si l'utilisateur essaie de s'abonner au même plan, le rediriger
          if (userData.subscription === planFromUrl) {
            toast({
              title: "Abonnement déjà actif",
              description: `Vous êtes déjà abonné au forfait ${planFromUrl}.`,
              duration: 5000
            });
            
            navigate('/dashboard');
            return;
          }
        }
        
        setSelectedPlan(planFromUrl);
        setIsAuthChecking(false);
      } catch (error) {
        console.error('Auth check error:', error);
        toast({
          title: "Erreur de vérification",
          description: "Une erreur est survenue. Veuillez réessayer.",
          variant: "destructive"
        });
        
        navigate('/offres');
      }
    };
    
    checkAuth();
  }, [navigate, location]);

  const togglePaymentMethod = () => {
    setUseStripePayment(prev => !prev);
  };

  const handleCardFormSubmit = (formData: PaymentFormData) => {
    processPayment(formData);
  };

  const initiateStripeCheckout = () => {
    handleStripeCheckout();
  };

  return {
    selectedPlan,
    currentSubscription,
    isAuthChecking,
    useStripePayment,
    isProcessing,
    isStripeProcessing,
    stripeCheckoutUrl,
    togglePaymentMethod,
    handleCardFormSubmit,
    initiateStripeCheckout
  };
};
