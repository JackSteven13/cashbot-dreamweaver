
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
  const lastKnownBalanceRef = useRef(userData?.balance || 0);
  
  // Mettre à jour lastKnownBalanceRef quand userData.balance change
  useEffect(() => {
    if (userData?.balance !== undefined && userData.balance !== lastKnownBalanceRef.current) {
      lastKnownBalanceRef.current = userData.balance;
      
      // Stocker également en localStorage pour persistence entre les rendus
      try {
        localStorage.setItem('lastKnownBalance', userData.balance.toString());
      } catch (e) {
        console.error("Failed to store balance in localStorage:", e);
      }
    }
  }, [userData?.balance]);

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
    isBotActive
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
        
        // Forcer l'activation du bot
        window.dispatchEvent(new CustomEvent('bot:external-status-change', {
          detail: { active: true }
        }));
      }
    };

    // Vérifier au chargement et toutes les minutes
    checkMidnightReset();
    const interval = setInterval(checkMidnightReset, 60000);
    
    return () => clearInterval(interval);
  }, [resetBotActivity]);

  // Au démarrage, générer une première session après un délai
  useEffect(() => {
    // Activer le bot initialement
    const timer = setTimeout(() => {
      // Ne déclencher que si le bot est actif
      if (isBotActive) {
        console.log('Initial session starting...');
        generateAutomaticRevenue(true); // true indique que c'est la première session
      } else {
        console.log('Bot inactive, no initial session will be scheduled');
      }
    }, 5000); // Attendre 5 secondes après le montage
    
    return () => clearTimeout(timer);
  }, []);

  return {
    lastAutoSessionTime,
    activityLevel,
    generateAutomaticRevenue,
    isSessionInProgress,
    isBotActive
  };
};
