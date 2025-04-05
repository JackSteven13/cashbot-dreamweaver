
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
  const botStatusRef = useRef<boolean>(isBotActive);
  const initialSessionExecutedRef = useRef<boolean>(false);
  const persistentBalanceRef = useRef<number>(userData?.balance || 0);

  // Effect to simulate automatic ad analysis
  useEffect(() => {
    // Synchroniser notre référence avec la prop
    botStatusRef.current = isBotActive;
    
    // Récupérer la balance depuis localStorage pour une meilleure persistance
    try {
      const storedBalance = localStorage.getItem('currentBalance');
      if (storedBalance) {
        const parsedBalance = parseFloat(storedBalance);
        if (!isNaN(parsedBalance)) {
          persistentBalanceRef.current = parsedBalance;
          console.log(`[Scheduler] Got persisted balance: ${persistentBalanceRef.current}`);
        }
      }
    } catch (e) {
      console.error("Failed to read persisted balance:", e);
    }
    
    // Get the daily limit for the current subscription
    const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Skip all auto sessions if bot is not active
    if (!isBotActive) {
      console.log("Bot inactif, aucune session automatique ne sera programmée");
      return () => {}; // Return empty cleanup function
    }
    
    // Start an initial session after a short delay if bot is active
    const initialTimeout = setTimeout(() => {
      // Vérifications de sécurité supplémentaires
      if (botStatusRef.current && todaysGainsRef.current < dailyLimit && !initialSessionExecutedRef.current) {
        console.log("[Scheduler] Démarrage de la session initiale automatique");
        initialSessionExecutedRef.current = true; // Marquer comme exécuté
        generateAutomaticRevenue(true);
        lastAutoSessionTimeRef.current = Date.now();
      } else {
        console.log("[Scheduler] Conditions non remplies pour session initiale");
      }
    }, 10000);
    
    // Set up interval for automatic sessions
    const autoSessionInterval = setInterval(() => {
      // Vérification stricte du statut du bot
      if (!botStatusRef.current) {
        return;
      }
      
      // Check if 2-3 minutes have passed since the last session
      const timeSinceLastSession = Date.now() - lastAutoSessionTimeRef.current;
      const randomInterval = Math.random() * 60000 + 120000; // Between 2 and 3 minutes
      
      // Vérifier également qu'on n'a pas atteint la limite journalière
      if (timeSinceLastSession >= randomInterval && todaysGainsRef.current < dailyLimit && botStatusRef.current) {
        console.log("[Scheduler] Génération automatique de revenus");
        generateAutomaticRevenue();
        lastAutoSessionTimeRef.current = Date.now();
      }
    }, 30000); // Check every 30 seconds

    // Écouter les changements d'état du bot
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        botStatusRef.current = isActive;
        console.log(`[Scheduler] Bot status updated: ${isActive ? 'active' : 'inactive'}`);
      }
    };
    
    // Écouter les changements de solde pour la persistence
    const handleBalanceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.balance;
      if (typeof newBalance === 'number' && newBalance >= 0) {
        persistentBalanceRef.current = newBalance;
        console.log(`[Scheduler] Updated persistent balance to ${newBalance}`);
        
        // S'assurer que le localStorage est aussi à jour
        localStorage.setItem('lastKnownBalance', newBalance.toString());
        localStorage.setItem('currentBalance', newBalance.toString());
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('balance:local-update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-update' as any, handleBalanceUpdate);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(autoSessionInterval);
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('balance:local-update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-update' as any, handleBalanceUpdate);
    };
  }, [isBotActive, userData.subscription, generateAutomaticRevenue, todaysGainsRef]);

  // Exposer les valeurs de référence de manière sécurisée
  return {
    lastAutoSessionTime: lastAutoSessionTimeRef.current,
    getLastAutoSessionTime: () => lastAutoSessionTimeRef.current,
    isInitialSessionExecuted: () => initialSessionExecutedRef.current,
    getCurrentPersistentBalance: () => persistentBalanceRef.current
  };
};
