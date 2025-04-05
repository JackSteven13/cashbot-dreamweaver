
import { useState } from 'react';
import { UserData } from '@/types/userData';
import { getEffectiveSubscription, SUBSCRIPTION_LIMITS } from '@/utils/subscription/subscriptionStatus';
import { handleError, ErrorType } from '@/utils/errorHandling';

interface SessionGainResult {
  success: boolean;
  finalGain: number;
  newBalance: number;
}

export const useSessionGain = () => {
  const [lastGain, setLastGain] = useState<number | null>(null);

  const calculateSessionGain = async (
    userData: UserData,
    currentBalance: number,
    setShowLimitAlert: (show: boolean) => void
  ): Promise<SessionGainResult> => {
    try {
      if (!userData) {
        throw new Error('Données utilisateur non disponibles');
      }

      // Obtenir l'abonnement effectif (tenant compte des essais gratuits)
      const effectiveSubscription = getEffectiveSubscription(userData.subscription || 'freemium');
      
      // Obtenir la limite journalière pour cet abonnement
      const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // S'assurer que currentBalance est un nombre
      const safeCurrentBalance = typeof currentBalance === 'number' ? currentBalance : 0;
      
      // Calculer combien on peut encore gagner aujourd'hui
      const remainingAllowedGain = Math.max(0, dailyLimit - safeCurrentBalance);
      
      if (remainingAllowedGain <= 0) {
        // L'utilisateur a atteint sa limite journalière
        setShowLimitAlert(true);
        return { success: false, finalGain: 0, newBalance: safeCurrentBalance };
      }
      
      // Calculer le gain potentiel de cette session
      let potentialGain: number;
      
      switch (effectiveSubscription) {
        case 'elite':
          // 0.30€ - 0.70€ par session
          potentialGain = Math.random() * (0.70 - 0.30) + 0.30;
          break;
        case 'gold':
          // 0.20€ - 0.50€ par session
          potentialGain = Math.random() * (0.50 - 0.20) + 0.20;
          break;
        case 'starter':
          // 0.10€ - 0.30€ par session
          potentialGain = Math.random() * (0.30 - 0.10) + 0.10;
          break;
        default:
          // 0.05€ - 0.15€ par session pour freemium
          potentialGain = Math.random() * (0.15 - 0.05) + 0.05;
      }
      
      // Arrondir à 2 décimales
      potentialGain = Math.round(potentialGain * 100) / 100;
      
      // Limiter le gain au restant autorisé
      const finalGain = Math.min(potentialGain, remainingAllowedGain);
      const newBalance = safeCurrentBalance + finalGain;
      
      // Mettre à jour l'état local pour le dernier gain
      setLastGain(finalGain);
      
      // Vérifier si avec ce gain, la limite est maintenant atteinte
      if (newBalance >= dailyLimit) {
        setShowLimitAlert(true);
      }
      
      // Enregistrer l'horodatage de la session
      localStorage.setItem(`lastSession_${userData.username}`, new Date().toISOString());
      
      return { success: true, finalGain, newBalance };
    } catch (error) {
      handleError(error, "Erreur lors du calcul du gain de session", ErrorType.UNKNOWN);
      return { success: false, finalGain: 0, newBalance: currentBalance || 0 };
    }
  };

  return {
    calculateSessionGain,
    lastGain
  };
};
