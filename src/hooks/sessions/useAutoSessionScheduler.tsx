
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
    
    // Récupérer la balance depuis localStorage si disponible
    try {
      const storedBalance = localStorage.getItem('currentBalance');
      if (storedBalance) {
        const parsedBalance = parseFloat(storedBalance);
        if (!isNaN(parsedBalance)) {
          persistentBalanceRef.current = parsedBalance;
          console.log(`Scheduler: Got persisted balance: ${persistentBalanceRef.current}`);
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
    // and only if this is the first time (to avoid duplicate sessions on re-renders)
    const initialTimeout = setTimeout(() => {
      // Vérification supplémentaire du statut du bot au moment de l'exécution
      if (botStatusRef.current && todaysGainsRef.current < dailyLimit && !initialSessionExecutedRef.current) {
        console.log("Démarrage de la session initiale automatique");
        initialSessionExecutedRef.current = true; // Marquer comme exécuté
        generateAutomaticRevenue(true);
        lastAutoSessionTimeRef.current = Date.now();
      } else {
        console.log("Bot inactif, limite atteinte ou session initiale déjà exécutée");
      }
    }, 10000);
    
    // Set up interval for automatic sessions
    const autoSessionInterval = setInterval(() => {
      // Vérification stricte du statut du bot
      if (!botStatusRef.current) {
        console.log("Bot inactif, pas de génération automatique");
        return;
      }
      
      // Check if 2-3 minutes have passed since the last session
      const timeSinceLastSession = Date.now() - lastAutoSessionTimeRef.current;
      const randomInterval = Math.random() * 60000 + 120000; // Between 2 and 3 minutes
      
      // Vérification supplémentaire du statut du bot avant génération
      if (timeSinceLastSession >= randomInterval && todaysGainsRef.current < dailyLimit && botStatusRef.current) {
        console.log("Génération automatique de revenus", timeSinceLastSession, randomInterval);
        generateAutomaticRevenue();
        lastAutoSessionTimeRef.current = Date.now();
      }
    }, 30000); // Check every 30 seconds

    // Écouter les changements d'état du bot
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        botStatusRef.current = isActive;
        console.log(`Bot status updated in scheduler: ${isActive ? 'active' : 'inactive'}`);
      }
    };
    
    // Écouter les changements de solde pour la persistence
    const handleBalanceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.currentBalance;
      if (typeof newBalance === 'number') {
        persistentBalanceRef.current = newBalance;
        console.log(`Scheduler: Updated persistent balance to ${newBalance}`);
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('balance:local-update' as any, handleBalanceUpdate);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(autoSessionInterval);
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('balance:local-update' as any, handleBalanceUpdate);
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
