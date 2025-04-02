
import React from 'react';
import SubscriptionPlanCard from '../SubscriptionPlanCard';
import { SUBSCRIPTION_LABELS, SUBSCRIPTION_PRICES } from '../constants';
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';
import { useIsMobile } from '@/hooks/use-mobile';

// Sample features for each plan
const SUBSCRIPTION_FEATURES: Record<string, string[]> = {
  'freemium': [
    'Limite de gains de 0,5€ par jour',
    '1 session manuelle par jour',
    '1 session automatique par jour',
    'Support par email'
  ],
  'starter': [
    'Limite de gains de 5€ par jour',
    'Sessions manuelles illimitées',
    'Sessions automatiques illimitées',
    'Support prioritaire'
  ],
  'gold': [
    'Limite de gains de 20€ par jour',
    'Sessions manuelles et automatiques illimitées',
    'Support prioritaire 24/7',
    'Accès à toutes les fonctionnalités'
  ],
  'elite': [
    'Limite de gains de 50€ par jour',
    'Accès illimité à toutes les fonctionnalités',
    'Support dédié 24/7',
    'Fonctionnalités exclusives'
  ]
};

// Sample descriptions for each plan
const SUBSCRIPTION_DESCRIPTIONS: Record<string, string> = {
  'freemium': 'Pour débuter et explorer la plateforme',
  'starter': 'Pour les utilisateurs sérieux',
  'gold': 'Pour maximiser vos gains',
  'elite': 'Pour les professionnels et entreprises'
};

// Ordre d'affichage personnalisé pour les plans
// Afficher Elite en premier, puis Gold, puis Starter, puis Freemium
const DISPLAY_ORDER = ['elite', 'gold', 'starter', 'freemium'];

interface PlanCardsProps {
  selectedPlan: string;
  currentSubscription: string;
  isHomePage: boolean;
  calculatedResults: Record<string, { revenue: number, profit: number }>;
  onSelectPlan: (plan: string) => void;
}

const PlanCards: React.FC<PlanCardsProps> = ({ 
  selectedPlan, 
  currentSubscription, 
  isHomePage, 
  calculatedResults, 
  onSelectPlan 
}) => {
  const isMobile = useIsMobile();

  // Fonction pour afficher les plans selon l'ordre personnalisé
  const renderPlans = () => {
    return DISPLAY_ORDER.map((plan) => {
      // Ne pas afficher freemium sur la page d'accueil
      if (plan === 'freemium' && isHomePage) return null;
      
      const isFreemium = plan === 'freemium';
      const isCurrent = plan === currentSubscription;
      const results = calculatedResults[plan] || { revenue: 0, profit: 0 };
      
      return (
        <div key={plan} className={isMobile ? "mb-3" : ""}>
          <SubscriptionPlanCard
            key={plan}
            title={SUBSCRIPTION_LABELS[plan] || plan}
            price={SUBSCRIPTION_PRICES[plan] || 0}
            description={SUBSCRIPTION_DESCRIPTIONS[plan] || ''}
            features={SUBSCRIPTION_FEATURES[plan] || []}
            limit={SUBSCRIPTION_LIMITS[plan] || 0}
            plan={plan}
            isSelected={selectedPlan === plan}
            isHomePage={isHomePage}
            isCurrent={isCurrent}
            isFreemium={isFreemium}
            subscriptionLabel={SUBSCRIPTION_LABELS[plan]}
            subscriptionPrice={SUBSCRIPTION_PRICES[plan]}
            revenue={results.revenue}
            profit={results.profit}
            onClick={() => onSelectPlan(plan)}
          />
        </div>
      );
    });
  };

  return (
    <div className={isMobile ? "" : "grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 overflow-hidden"}>
      {renderPlans()}
    </div>
  );
};

export default PlanCards;
