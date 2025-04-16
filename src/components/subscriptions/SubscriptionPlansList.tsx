
import React, { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { PlanType } from '@/hooks/payment/types';
import FeaturedPlanCard from './FeaturedPlanCard';
import StandardPlansList from './StandardPlansList';
import { createSubscriptionPlans } from './subscriptionPlansData';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionPlansListProps {
  currentSubscription: string;
}

const SubscriptionPlansList: React.FC<SubscriptionPlansListProps> = ({ 
  currentSubscription 
}) => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  // Initialize selectedPlan to 'elite' by default
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('elite');
  const [isNavigating, setIsNavigating] = useState(false);
  
  const handleSelectPlan = (planId: PlanType) => {
    if (isNavigating) return; // Prevent multiple clicks
    
    if (planId === currentSubscription) {
      toast({
        title: "Vous êtes déjà abonné à ce forfait",
        description: "Vous bénéficiez déjà des avantages de ce forfait.",
      });
      return;
    }
    
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour choisir un forfait.",
        variant: "destructive"
      });
      // Rediriger vers la page de connexion avec un paramètre de retour
      navigate(`/login?redirect=/offres&plan=${planId}`);
      return;
    }
    
    // First update the selected plan
    setSelectedPlan(planId);
    setIsNavigating(true);
    
    // Show confirmation toast instead of immediate redirection
    toast({
      title: "Forfait sélectionné",
      description: "Vous allez être redirigé vers le récapitulatif de votre commande."
    });
    
    // Add delay to give user time to read confirmation
    setTimeout(() => {
      try {
        console.log("Navigating to payment page with plan:", planId);
        // Use navigate which is more reliable than direct location change
        navigate(`/payment?plan=${planId}`);
      } catch (error) {
        console.error("Navigation error:", error);
        // Fallback in case the above fails
        window.location.href = `/payment?plan=${planId}`;
        setIsNavigating(false);
      }
    }, 1500); // Increased delay to 1.5 seconds for better UX
  };
  
  // Get subscription plans data
  const plans = createSubscriptionPlans(currentSubscription);

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Featured Elite plan */}
      <FeaturedPlanCard 
        currentSubscription={currentSubscription}
        onSelectPlan={handleSelectPlan}
      />
      
      {/* Standard plans */}
      <StandardPlansList
        plans={plans}
        selectedPlan={selectedPlan}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
};

export default SubscriptionPlansList;
