
import { useState, useRef, useEffect } from 'react';
import { useAutoRevenueGenerator } from './useAutoRevenueGenerator';
import { useAutoSessionScheduler } from './useAutoSessionScheduler';
import { useDailyLimits } from './useDailyLimits';
import { useActivitySimulation } from './useActivitySimulation';

export const useAutoSessions = (
  userData: any,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void
) => {
  // Références pour garantir la stabilité des données
  const todaysGainsRef = useRef(0);

  // Custom hooks pour la logique de génération automatique
  const { getDailyLimit } = useDailyLimits(userData?.subscription);
  
  const {
    generateAutomaticRevenue,
    isSessionInProgress,
    isBotActive,
    resetBotActivity
  } = useAutoRevenueGenerator(
    userData,
    updateBalance,
    setShowLimitAlert,
    todaysGainsRef,
    getDailyLimit
  );

  // Configurer le planificateur automatique  
  const { lastAutoSessionTime } = useAutoSessionScheduler(
    todaysGainsRef,
    generateAutomaticRevenue,
    userData,
    isBotActive // Passer l'état actif du bot
  );

  // Simuler des niveaux d'activité
  const { activityLevel } = useActivitySimulation();

  // Effet pour réinitialiser le bot à minuit
  useEffect(() => {
    const checkMidnightReset = () => {
      const now = new Date();
      // Si c'est un nouveau jour (00:00-00:05), réinitialiser l'activité du bot
      if (now.getHours() === 0 && now.getMinutes() < 5) {
        resetBotActivity();
        todaysGainsRef.current = 0;
      }
    };

    // Vérifier au chargement et toutes les minutes
    checkMidnightReset();
    const interval = setInterval(checkMidnightReset, 60000);
    
    return () => clearInterval(interval);
  }, [resetBotActivity]);

  return {
    lastAutoSessionTime,
    activityLevel,
    generateAutomaticRevenue,
    isSessionInProgress,
    isBotActive
  };
};
