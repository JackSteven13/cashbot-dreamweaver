
import React, { useState, useEffect } from 'react';
import { PlanType } from '@/hooks/payment/types';
import SubscriptionPlanCard from '@/components/dashboard/calculator/SubscriptionPlanCard';
import Button from '@/components/Button';
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';

interface Plan {
  id: PlanType;
  title: string;
  price: number;
  description: string;
  features: string[];
  limit: number;
  mostPopular?: boolean;
  disabled?: boolean;
  current?: boolean;
}

interface SubscriptionPlansListProps {
  currentSubscription: string;
}

const SubscriptionPlansList: React.FC<SubscriptionPlansListProps> = ({ 
  currentSubscription 
}) => {
  const navigate = useNavigate();
  // Initialize selectedPlan to 'alpha' by default
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('alpha');
  
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
    
    if (planId === 'freemium') {
      // Rediriger vers le processus de paiement pour freemium (gratuit)
      navigate('/payment', { state: { plan: 'freemium' } });
    } else {
      // Rediriger vers le processus de paiement pour le plan sélectionné
      navigate('/payment', { state: { plan: planId } });
    }
  };
  
  // Définir les plans avec les détails et caractéristiques
  const plans: Plan[] = [
    {
      id: 'freemium',
      title: 'Freemium',
      price: 0,
      description: 'Pour débuter et explorer la plateforme',
      features: [
        'Limite de gains de 0,5€ par jour',
        '1 session manuelle par jour',
        '1 session automatique par jour',
        'Support par email'
      ],
      limit: SUBSCRIPTION_LIMITS['freemium'],
      current: currentSubscription === 'freemium',
      disabled: currentSubscription === 'freemium'
    },
    {
      id: 'pro',
      title: 'Pro',
      price: 19.99,
      description: 'Pour les utilisateurs sérieux',
      features: [
        'Limite de gains de 5€ par jour',
        'Sessions manuelles illimitées',
        'Sessions automatiques illimitées',
        'Support prioritaire',
        'Accès aux fonctionnalités avancées'
      ],
      limit: SUBSCRIPTION_LIMITS['pro'],
      mostPopular: true,
      current: currentSubscription === 'pro',
      disabled: currentSubscription === 'pro'
    },
    {
      id: 'visionnaire',
      title: 'Visionnaire',
      price: 49.99,
      description: 'Pour maximiser vos gains',
      features: [
        'Limite de gains de 20€ par jour',
        'Sessions manuelles et automatiques illimitées',
        'Support prioritaire 24/7',
        'Accès à toutes les fonctionnalités',
        'Commissions de parrainage augmentées'
      ],
      limit: SUBSCRIPTION_LIMITS['visionnaire'],
      current: currentSubscription === 'visionnaire',
      disabled: currentSubscription === 'visionnaire'
    },
    {
      id: 'alpha',
      title: 'Alpha',
      price: 99.99,
      description: 'Pour les professionnels et entreprises',
      features: [
        'Limite de gains de 50€ par jour',
        'Accès illimité à toutes les fonctionnalités',
        'Support dédié 24/7',
        'Commissions de parrainage maximales',
        'Fonctionnalités exclusives en avant-première'
      ],
      limit: SUBSCRIPTION_LIMITS['alpha'],
      current: currentSubscription === 'alpha',
      disabled: currentSubscription === 'alpha'
    }
  ];

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Section principale avec le plan Alpha mis en évidence */}
      <div className="w-full max-w-4xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-6 rounded-xl border border-purple-200 dark:border-purple-800 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300">Plan Recommandé</h2>
          <p className="text-gray-600 dark:text-gray-300">Le meilleur choix pour maximiser vos revenus</p>
        </div>
        
        <div className="w-full">
          <SubscriptionPlanCard
            key="alpha"
            title="Alpha"
            price={99.99}
            description="Pour les professionnels et entreprises"
            features={[
              'Limite de gains de 50€ par jour',
              'Accès illimité à toutes les fonctionnalités',
              'Support dédié 24/7',
              'Commissions de parrainage maximales',
              'Fonctionnalités exclusives en avant-première'
            ]}
            limit={SUBSCRIPTION_LIMITS['alpha']}
            current={currentSubscription === 'alpha'}
            isSelected={selectedPlan === 'alpha' && currentSubscription !== 'alpha'}
            action={
              <Button
                variant={currentSubscription === 'alpha' ? "secondary" : "primary"}
                className={`w-full ${currentSubscription === 'alpha' ? 'opacity-50 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                disabled={currentSubscription === 'alpha'}
                onClick={() => handleSelectPlan('alpha')}
              >
                {currentSubscription === 'alpha' ? 'Abonnement actuel' : 'Sélectionner Alpha'}
              </Button>
            }
          />
        </div>
      </div>
      
      {/* Section avec les autres plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {plans.filter(plan => plan.id !== 'alpha').map((plan) => (
          <SubscriptionPlanCard
            key={plan.id}
            title={plan.title}
            price={plan.price}
            description={plan.description}
            features={plan.features}
            limit={plan.limit}
            current={plan.current}
            mostPopular={plan.mostPopular}
            isSelected={selectedPlan === plan.id && !plan.current}
            action={
              <Button
                variant={plan.current ? "secondary" : "primary"}
                className={`w-full ${plan.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={plan.disabled}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.current ? 'Abonnement actuel' : `Sélectionner ${plan.title}`}
              </Button>
            }
          />
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlansList;
