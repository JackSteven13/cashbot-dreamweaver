import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { PlanType } from './types';
import { useFreemiumSubscription } from './useFreemiumSubscription';
import { usePaidSubscription } from './usePaidSubscription';
import { useSubscriptionVerification } from './useSubscriptionVerification';

export const useStripeCheckout = (selectedPlan: PlanType | null) => {
  const navigate = useNavigate();
  const { activateFreemiumSubscription } = useFreemiumSubscription();
  const { isStripeProcessing, processPaidSubscription } = usePaidSubscription();
  const { actualSubscription, isChecking, verifySubscriptionChange } = useSubscriptionVerification();

  const handleStripeCheckout = async () => {
    if (!selectedPlan) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un plan",
        variant: "destructive"
      });
      return;
    }

    // Vérifier si l'utilisateur est déjà abonné à ce plan
    const isAlreadySubscribed = await verifySubscriptionChange(selectedPlan);
    
    // Si l'utilisateur est déjà abonné à ce plan, afficher un message et rediriger
    if (isAlreadySubscribed) {
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
      await activateFreemiumSubscription();
      return;
    }

    // Pour les plans payants
    await processPaidSubscription(selectedPlan);
  };

  return {
    isStripeProcessing,
    handleStripeCheckout,
    actualSubscription,
    isChecking
  };
};
