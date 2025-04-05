
import { useState, useEffect } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

/**
 * Hook for scheduling automatic sessions
 */
export const useAutoSessionScheduler = (
  todaysGainsRef: React.MutableRefObject<number>,
  generateAutomaticRevenue: (isFirst?: boolean) => Promise<void>,
  userData: any,
  isBotActive?: boolean
) => {
  const [lastAutoSessionTime, setLastAutoSessionTime] = useState(Date.now());

  // Effect to simulate automatic ad analysis
  useEffect(() => {
    // Get the daily limit for the current subscription
    const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Start an initial session immediately to show activity to the user
    // Only if we're below the daily limit
    const initialTimeout = setTimeout(() => {
      if (todaysGainsRef.current < dailyLimit) {
        // IMPORTANT: Toujours utiliser une session initiale en arrière-plan
        generateAutomaticRevenue(true);
        setLastAutoSessionTime(Date.now());
      }
    }, 10000);
    
    // Set up interval for automatic sessions
    const autoSessionInterval = setInterval(() => {
      // Skip if bot is explicitly not active
      if (isBotActive === false) {
        return;
      }
      
      // Check if 2-3 minutes have passed since the last session
      const timeSinceLastSession = Date.now() - lastAutoSessionTime;
      const randomInterval = Math.random() * 60000 + 120000; // Between 2 and 3 minutes
      
      if (timeSinceLastSession >= randomInterval && todaysGainsRef.current < dailyLimit) {
        // IMPORTANT: Toujours exécuter en arrière-plan pour éviter l'écran de chargement
        generateAutomaticRevenue();
        setLastAutoSessionTime(Date.now());
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(autoSessionInterval);
    };
  }, [lastAutoSessionTime, userData.subscription, generateAutomaticRevenue, todaysGainsRef, isBotActive]);

  return {
    lastAutoSessionTime,
    setLastAutoSessionTime
  };
};
