
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { useUserData } from '@/hooks/userData';
import { getPlanById, PLANS } from '@/utils/plans';
import { PaymentFormData, PlanType } from './types';
import { openStripeWindow } from './stripeWindowManager';
import { toast } from '@/components/ui/use-toast';

export const usePaymentPage = () => {
  // Navigation et paramètres URL
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');
  
  // État utilisateur et authentification
  const { userData, isLoading } = useUserData();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // État du plan sélectionné
  const [selectedPlan, setSelectedPlan] = useSessionStorage<PlanType>('selectedPlan', null);
  const [currentSubscription, setCurrentSubscription] = useSessionStorage<string | null>('currentSubscription', null);
  
  // État du processus de paiement
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [useStripePayment, setUseStripePayment] = useState(true);
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);
  
  // Charger le plan depuis les paramètres URL
  useEffect(() => {
    const plan = getPlanById(planParam);
    if (plan) {
      setSelectedPlan(plan);
    }
  }, [planParam, setSelectedPlan]);
  
  // Vérifier l'authentification et récupérer les données utilisateur
  useEffect(() => {
    if (!isLoading && userData) {
      setCurrentSubscription(userData.subscription || 'freemium');
      setIsAuthChecking(false);
    } else if (!isLoading && !userData) {
      navigate('/login?redirect=payment');
    }
  }, [userData, isLoading, navigate, setCurrentSubscription]);
  
  // Méthodes de paiement
  const togglePaymentMethod = () => {
    setUseStripePayment(prev => !prev);
    setStripeCheckoutUrl(null);
  };
  
  const handleCardFormSubmit = async (formData: PaymentFormData) => {
    setIsProcessing(true);
    
    try {
      // Simulation de traitement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Succès
      toast({
        title: "Paiement réussi",
        description: "Votre abonnement a été activé avec succès.",
        variant: "default" // Modifier vers "default"
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error("Erreur de paiement:", error);
      toast({
        title: "Échec du paiement",
        description: "Une erreur est survenue lors du traitement de votre paiement. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const initiateStripeCheckout = async () => {
    setIsStripeProcessing(true);
    
    try {
      // Simulation d'obtention d'une URL Stripe
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // URL de test pour Stripe
      const stripeUrl = "https://checkout.stripe.com/pay/dummy_checkout_url";
      setStripeCheckoutUrl(stripeUrl);
      
      // Notifier l'utilisateur que l'URL est prête
      toast({
        title: "Redirection vers Stripe",
        description: "Vous allez être redirigé vers la page de paiement sécurisée...",
        duration: 2000
      });
      
      // Ouvrir la fenêtre Stripe avec un délai pour permettre à l'UI de se mettre à jour
      setTimeout(() => {
        const opened = openStripeWindow(stripeUrl);
        if (!opened) {
          toast({
            title: "Impossible d'ouvrir la fenêtre",
            description: "Veuillez autoriser les popups pour ce site ou utilisez le bouton de redirection.",
            variant: "destructive"
          });
        }
      }, 500);
    } catch (error) {
      console.error("Erreur d'initialisation Stripe:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'initialiser le paiement Stripe. Veuillez réessayer.",
        variant: "destructive"
      });
      setStripeCheckoutUrl(null);
    } finally {
      setIsStripeProcessing(false);
    }
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
