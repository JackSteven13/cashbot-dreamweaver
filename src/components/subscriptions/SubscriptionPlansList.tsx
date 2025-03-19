
import React from 'react';
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
  
  const handleSelectPlan = (planId: PlanType) => {
    if (planId === currentSubscription) {
      toast({
        title: "Vous êtes déjà abonné à ce forfait",
        description: "Vous bénéficiez déjà des avantages de ce forfait.",
      });
      return;
    }
    
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
      {plans.map((plan) => (
        <SubscriptionPlanCard
          key={plan.id}
          title={plan.title}
          price={plan.price}
          description={plan.description}
          features={plan.features}
          limit={plan.limit}
          current={plan.current}
          mostPopular={plan.mostPopular}
          action={
            <Button
              variant={plan.current ? "secondary" : "primary"}
              className={`w-full ${plan.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={plan.disabled}
              onClick={() => handleSelectPlan(plan.id)}
            >
              {plan.current ? 'Abonnement actuel' : 'Sélectionner'}
            </Button>
          }
        />
      ))}
    </div>
  );
};

export default SubscriptionPlansList;
