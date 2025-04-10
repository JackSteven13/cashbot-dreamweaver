
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
        'Limite de gains de 50€ par jour',
        'Accès illimité à toutes les fonctionnalités',
        'Commission de parrainage de 100%',
        '30% de commission récurrente',
        '10% de commission niveau 2',
        'Seuil de retrait de 1000€',
        'Support dédié 24/7',
        'Fonctionnalités exclusives en avant-première'
      ],
      limit: SUBSCRIPTION_LIMITS['elite'],
      commission: 1.0, // Updated from 0.5 to 1.0 (100%)
      current: currentSubscription === 'elite',
      disabled: currentSubscription === 'elite'
    },
    {
      id: 'gold',
      title: 'Gold',
      price: 349,
      description: 'Pour maximiser vos gains',
      features: [
        'Limite de gains de 20€ par jour',
        'Sessions manuelles et automatiques illimitées',
        'Commission de parrainage de 40%',
        '20% de commission récurrente',
        '5% de commission niveau 2',
        'Seuil de retrait de 700€',
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
        'Limite de gains de 5€ par jour',
        'Sessions manuelles illimitées',
        'Sessions automatiques illimitées',
        'Commission de parrainage de 30%',
        '10% de commission récurrente',
        'Seuil de retrait de 400€',
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
        'Limite de gains de 0,5€ par jour',
        '1 session manuelle par jour',
        '1 session automatique par jour',
        'Commission de parrainage de 20%',
        'Seuil de retrait de 200€',
        'Support par email'
      ],
      limit: SUBSCRIPTION_LIMITS['freemium'],
      commission: 0.2,
      current: currentSubscription === 'freemium',
      disabled: currentSubscription === 'freemium'
    }
  ];
};
