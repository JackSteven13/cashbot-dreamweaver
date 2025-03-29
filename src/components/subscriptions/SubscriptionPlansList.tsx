
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
    
    // Prevent any race conditions that might affect navigation
    setTimeout(() => {
      try {
        console.log("Navigating to payment page with plan:", planId);
        // Use navigate with state and no replace to ensure history is maintained
        navigate('/payment', { 
          state: { plan: planId },
          replace: false 
        });
      } catch (error) {
        console.error("Navigation error:", error);
        // Fallback to a simpler navigation approach
        window.location.href = `/payment?plan=${planId}`;
      }
    }, 100);
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
