
import React, { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { PlanType } from '@/hooks/payment/types';
import FeaturedPlanCard from './FeaturedPlanCard';
import StandardPlansList from './StandardPlansList';
import { createSubscriptionPlans } from './subscriptionPlansData';

interface SubscriptionPlansListProps {
  currentSubscription: string;
}

const SubscriptionPlansList: React.FC<SubscriptionPlansListProps> = ({ 
  currentSubscription 
}) => {
  const navigate = useNavigate();
  // Initialize selectedPlan to 'elite' by default
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('elite');
  
  const handleSelectPlan = (planId: PlanType) => {
    if (planId === currentSubscription) {
      toast({
        title: "Vous êtes déjà abonné à ce forfait",
        description: "Vous bénéficiez déjà des avantages de ce forfait.",
      });
      return;
    }
    
    // First update the selected plan
    setSelectedPlan(planId);
    console.log("Plan sélectionné:", planId);
    
    // Use setTimeout to prevent navigation issues, especially on mobile
    setTimeout(() => {
      if (planId === 'freemium') {
        // Rediriger vers le processus de paiement pour freemium (gratuit)
        navigate('/payment', { 
          state: { plan: 'freemium' },
          replace: false
        });
      } else {
        // Rediriger vers le processus de paiement pour le plan sélectionné
        navigate('/payment', { 
          state: { plan: planId },
          replace: false
        });
      }
    }, 50);
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
