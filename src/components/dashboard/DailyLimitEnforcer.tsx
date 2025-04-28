
import { FC, useEffect } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { useAuth } from '@/hooks/useAuth';

/**
 * Ce composant a été désactivé temporairement pour permettre une génération de revenus sans restriction
 */
const DailyLimitEnforcer: FC = () => {
  // Composant désactivé pour permettre le dépassement des limites
  return null;
};

export default DailyLimitEnforcer;
