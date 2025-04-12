
import { useState, useEffect, useCallback } from 'react';
import { useUserData } from '@/hooks/userData';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { getUserSelectedPlan, clearSelectedPlan } from '@/utils/plans';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useStripeCheckoutRedirect } from '@/hooks/useStripeCheckoutRedirect';

export const usePaymentPage = () => {
  const { userData, isLoading: isUserLoading } = useUserData();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [useStripePayment, setUseStripePayment] = useState(true);
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);
  const { setupStripeRedirect } = useStripeCheckoutRedirect();
  
  // Vérifier l'authentification
  const isAuthChecking = isUserLoading;
  
  // Obtenir le plan sélectionné au chargement de la page
  useEffect(() => {
    const storedPlan = getUserSelectedPlan();
    if (storedPlan) {
      setSelectedPlan(storedPlan);
    }
    
    // Vérifier si une URL Stripe a été stockée
    const savedStripeUrl = localStorage.getItem('stripeCheckoutUrl');
    if (savedStripeUrl) {
      setStripeCheckoutUrl(savedStripeUrl);
    }
    
    // Nettoyer les éléments après 1 seconde pour éviter les conflits
    // mais permettre aux redirections de fonctionner
    const cleaner = setTimeout(() => {
      clearSelectedPlan();
    }, 1000);
    
    return () => clearTimeout(cleaner);
  }, []);
  
  // Basculer entre les méthodes de paiement
  const togglePaymentMethod = useCallback(() => {
    setUseStripePayment(prev => !prev);
  }, []);
  
  // Gérer la soumission du formulaire de carte
  const handleCardFormSubmit = async (formData: any) => {
    setIsProcessing(true);
    
    try {
      // Simuler un traitement de paiement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Paiement traité",
        description: "Votre paiement a été traité avec succès!",
        variant: "success",
      });
      
      // Nettoyer et rediriger
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      
    } catch (error) {
      console.error("Erreur de paiement:", error);
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue lors du traitement de votre paiement.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Initier un paiement Stripe
  const initiateStripeCheckout = async () => {
    try {
      // Réinitialisation des erreurs
      localStorage.removeItem('stripeError');
      
      setIsStripeProcessing(true);
      
      if (!selectedPlan) {
        throw new Error("Veuillez sélectionner un forfait");
      }
      
      // Créer une session de paiement Stripe
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: selectedPlan }
      });
      
      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error("Aucune URL de paiement reçue");
      
      // Stocker l'URL pour la redirection
      setStripeCheckoutUrl(data.url);
      
      // Rediriger vers Stripe en utilisant notre hook spécialisé
      const redirected = setupStripeRedirect(data.url);
      
      // Si la redirection a échoué, afficher un message
      if (!redirected) {
        toast({
          title: "Erreur de redirection",
          description: "Impossible d'ouvrir la page de paiement. Veuillez essayer à nouveau.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("Erreur Stripe:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsStripeProcessing(false);
    }
  };
  
  return {
    selectedPlan,
    currentSubscription: userData?.subscription || 'freemium',
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

export default usePaymentPage;
