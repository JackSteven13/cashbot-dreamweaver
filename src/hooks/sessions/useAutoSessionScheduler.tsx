
import { useRef, useEffect } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

/**
 * Hook for scheduling automatic sessions
 */
export const useAutoSessionScheduler = (
  todaysGainsRef: React.MutableRefObject<number>,
  generateAutomaticRevenue: (isFirst?: boolean) => Promise<void>,
  userData: any,
  isBotActive: boolean = true
) => {
  // Utiliser useRef au lieu de useState pour éviter les erreurs React
  const lastAutoSessionTimeRef = useRef<number>(Date.now());

  // Effect to simulate automatic ad analysis
  useEffect(() => {
    // Get the daily limit for the current subscription
    const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Skip all auto sessions if bot is not active
    if (!isBotActive) {
      console.log("Bot inactif, aucune session automatique ne sera programmée");
      return () => {}; // Return empty cleanup function
    }
    
    // Start an initial session after a short delay if bot is active
    const initialTimeout = setTimeout(() => {
      if (todaysGainsRef.current < dailyLimit) {
        console.log("Démarrage de la session initiale automatique");
        generateAutomaticRevenue(true);
        lastAutoSessionTimeRef.current = Date.now();
      } else {
        console.log("Limite journalière déjà atteinte, aucune session automatique ne sera démarrée");
      }
    }, 10000);
    
    // Set up interval for automatic sessions
    const autoSessionInterval = setInterval(() => {
      // Skip if bot is explicitly not active
      if (!isBotActive) {
        console.log("Bot inactif, pas de génération automatique");
        return;
      }
      
      // Check if 2-3 minutes have passed since the last session
      const timeSinceLastSession = Date.now() - lastAutoSessionTimeRef.current;
      const randomInterval = Math.random() * 60000 + 120000; // Between 2 and 3 minutes
      
      if (timeSinceLastSession >= randomInterval && todaysGainsRef.current < dailyLimit) {
        console.log("Génération automatique de revenus");
        generateAutomaticRevenue();
        lastAutoSessionTimeRef.current = Date.now();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(autoSessionInterval);
    };
  }, [isBotActive, userData.subscription, generateAutomaticRevenue, todaysGainsRef]);

  // Exposer les valeurs de référence de manière sécurisée
  return {
    lastAutoSessionTime: lastAutoSessionTimeRef.current,
    getLastAutoSessionTime: () => lastAutoSessionTimeRef.current
  };
};
