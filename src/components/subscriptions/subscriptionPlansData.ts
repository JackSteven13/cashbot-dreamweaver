
import { PlanType } from '@/hooks/payment/types';
import { SUBSCRIPTION_LIMITS } from '@/components/dashboard/summary/constants';
import { Plan } from './types';

export const createSubscriptionPlans = (currentSubscription: string): Plan[] => {
  return [
    {
      id: 'elite',
      title: 'Élite',
      price: 549,
      description: 'Pour les professionnels et entreprises',
      features: [
        'Accès illimité à toutes les fonctionnalités',
        'Limite quotidienne de 25€',
        'Commission de parrainage de 50%',
        '30% de commission récurrente',
        '10% de commission niveau 2',
        'Seuil de retrait de 5€',
        'Support dédié 24/7',
        'Fonctionnalités exclusives en avant-première'
      ],
      limit: SUBSCRIPTION_LIMITS['elite'],
      commission: 0.5,
      current: currentSubscription === 'elite',
      disabled: currentSubscription === 'elite'
    },
    {
      id: 'gold',
      title: 'Gold',
      price: 349,
      description: 'Pour maximiser vos gains',
      features: [
        '30 sessions par jour',
        'Limite quotidienne de 15€',
        'Commission de parrainage de 40%',
        '20% de commission récurrente',
        '5% de commission niveau 2',
        'Seuil de retrait de 10€',
        'Support prioritaire 24/7'
      ],
      limit: SUBSCRIPTION_LIMITS['gold'],
      commission: 0.4,
      current: currentSubscription === 'gold',
      disabled: currentSubscription === 'gold'
    },
    {
      id: 'starter',
      title: 'Starter',
      price: 99,
      description: 'Pour les utilisateurs sérieux',
      features: [
        '10 sessions par jour',
        'Limite quotidienne de 5€',
        'Commission de parrainage de 30%',
        '10% de commission récurrente',
        'Seuil de retrait de 15€',
        'Support prioritaire'
      ],
      limit: SUBSCRIPTION_LIMITS['starter'],
      commission: 0.3,
      mostPopular: true,
      current: currentSubscription === 'starter',
      disabled: currentSubscription === 'starter'
    },
    {
      id: 'freemium',
      title: 'Freemium',
      price: 0,
      description: 'Pour débuter et explorer la plateforme',
      features: [
        '1 session par jour',
        'Limite quotidienne de 0,50€',
        'Commission de parrainage de 20%',
        'Seuil de retrait de 20€',
        'Support par email'
      ],
      limit: SUBSCRIPTION_LIMITS['freemium'],
      commission: 0.2,
      current: currentSubscription === 'freemium',
      disabled: currentSubscription === 'freemium'
    }
  ];
};

export default createSubscriptionPlans;
