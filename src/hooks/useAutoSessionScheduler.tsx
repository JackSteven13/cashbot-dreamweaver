import { useRef, useEffect } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { toast } from "@/components/ui/use-toast";

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
  const highestBalanceRef = useRef<number>(0);
  const globalBalanceSyncRef = useRef<NodeJS.Timeout | null>(null);
  const forceResetTriggeredRef = useRef<boolean>(false);

  // Effect to simulate automatic ad analysis
  useEffect(() => {
    // Synchroniser notre référence avec la prop
    botStatusRef.current = isBotActive;
    
    // Récupérer la balance depuis localStorage pour une meilleure persistance
    try {
      const storedHighestBalance = localStorage.getItem('highestBalance');
      const storedBalance = localStorage.getItem('currentBalance') || localStorage.getItem('lastKnownBalance');
      
      if (storedHighestBalance) {
        const parsedBalance = parseFloat(storedHighestBalance);
        if (!isNaN(parsedBalance)) {
          highestBalanceRef.current = parsedBalance;
          console.log(`[Scheduler] Got highest persisted balance: ${highestBalanceRef.current}`);
        }
      }
      
      if (storedBalance) {
        const parsedBalance = parseFloat(storedBalance);
        if (!isNaN(parsedBalance)) {
          // Toujours utiliser la valeur la plus élevée
          persistentBalanceRef.current = Math.max(parsedBalance, persistentBalanceRef.current, highestBalanceRef.current);
          console.log(`[Scheduler] Got persisted balance: ${persistentBalanceRef.current}`);
          
          // Stocker également comme solde le plus élevé s'il est plus grand
          if (persistentBalanceRef.current > highestBalanceRef.current) {
            highestBalanceRef.current = persistentBalanceRef.current;
            localStorage.setItem('highestBalance', highestBalanceRef.current.toString());
          }
        }
      }
    } catch (e) {
      console.error("Failed to read persisted balance:", e);
    }
    
    // Configurer une synchronisation périodique du solde
    globalBalanceSyncRef.current = setInterval(() => {
      // Déclencher un événement pour que tous les composants utilisent le solde le plus élevé
      if (highestBalanceRef.current > 0) {
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { balance: highestBalanceRef.current }
        }));
      }
    }, 30000); // Synchroniser toutes les 30 secondes
    
    // Get the daily limit for the current subscription
    const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Skip all auto sessions if bot is not active
    if (!isBotActive) {
      console.log("Bot inactif, aucune session automatique ne sera programmée");
      return () => {
        if (globalBalanceSyncRef.current) clearInterval(globalBalanceSyncRef.current);
      };
    }
    
    // Start an initial session after a short delay if bot is active
    const initialTimeout = setTimeout(() => {
      // Vérifications de sécurité supplémentaires
      if (botStatusRef.current && persistentBalanceRef.current < dailyLimit && !initialSessionExecutedRef.current) {
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
      const randomInterval = Math.random() * 60000 + 60000; // Between 1 and 2 minutes (accéléré)
      
      // Vérifier également qu'on n'a pas atteint la limite journalière
      if (timeSinceLastSession >= randomInterval && persistentBalanceRef.current < dailyLimit && botStatusRef.current) {
        console.log("[Scheduler] Génération automatique de revenus");
        generateAutomaticRevenue();
        lastAutoSessionTimeRef.current = Date.now();
      }
    }, 30000); // Check every 30 seconds

    // Écouteur pour forcer une réinitialisation complète (nouveau jour ou réinitialisation manuelle)
    const handleForceReset = (event: CustomEvent) => {
      const reason = event.detail?.reason || 'manual';
      
      console.log(`[Scheduler] Réinitialisation forcée du système: ${reason}`);
      
      // Réinitialiser toutes les valeurs
      persistentBalanceRef.current = 0;
      highestBalanceRef.current = 0;
      initialSessionExecutedRef.current = false;
      todaysGainsRef.current = 0;
      
      // Réinitialiser le localStorage
      localStorage.removeItem('highestBalance');
      localStorage.removeItem('currentBalance');
      localStorage.removeItem('lastKnownBalance');
      
      // Activer le bot
      botStatusRef.current = true;
      window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
        detail: { active: true } 
      }));
      
      // Déclencher une mise à jour de l'interface
      window.dispatchEvent(new CustomEvent('balance:reset-complete', { 
        detail: { success: true } 
      }));
      
      // Marquer la réinitialisation comme traitée
      forceResetTriggeredRef.current = true;
      
      // Programmer une première session après un court délai
      setTimeout(() => {
        console.log("[Scheduler] Première session après réinitialisation");
        generateAutomaticRevenue(true);
        lastAutoSessionTimeRef.current = Date.now();
      }, 3000);
      
      // Afficher un toast pour informer l'utilisateur
      toast({
        title: "Système réinitialisé",
        description: "Le système d'analyse a été réinitialisé et va recommencer à générer des revenus.",
        variant: "default",
        duration: 5000
      });
    };
    
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
        // Ne mettre à jour que si le nouveau solde est plus élevé
        if (newBalance > persistentBalanceRef.current) {
          persistentBalanceRef.current = newBalance;
          console.log(`[Scheduler] Updated persistent balance to ${newBalance}`);
          
          // Mettre à jour aussi le solde le plus élevé si nécessaire
          if (newBalance > highestBalanceRef.current) {
            highestBalanceRef.current = newBalance;
            console.log(`[Scheduler] Updated highest balance to ${newBalance}`);
            
            // S'assurer que le localStorage est aussi à jour
            try {
              localStorage.setItem('highestBalance', highestBalanceRef.current.toString());
            } catch (e) {
              console.error("Failed to store highest balance:", e);
            }
          }
          
          // S'assurer que le localStorage est aussi à jour
          localStorage.setItem('lastKnownBalance', newBalance.toString());
          localStorage.setItem('currentBalance', newBalance.toString());
        }
      }
    };
    
    // Nouveau gestionnaire pour la synchronisation forcée
    const handleForceSyncBalance = (event: CustomEvent) => {
      const syncedBalance = event.detail?.balance;
      if (typeof syncedBalance === 'number' && syncedBalance > 0) {
        // Ne mettre à jour que si le solde synchronisé est plus élevé que notre maximum
        if (syncedBalance > highestBalanceRef.current) {
          console.log(`[Scheduler] Forced sync of highest balance: ${syncedBalance}`);
          highestBalanceRef.current = syncedBalance;
          persistentBalanceRef.current = syncedBalance;
          
          // Mettre à jour localStorage
          localStorage.setItem('highestBalance', syncedBalance.toString());
          localStorage.setItem('currentBalance', syncedBalance.toString());
          localStorage.setItem('lastKnownBalance', syncedBalance.toString());
        }
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('balance:local-update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-sync' as any, handleForceSyncBalance);
    window.addEventListener('balance:force-reset' as any, handleForceReset);
    
    // Vérifier si c'est un nouveau jour
    const checkNewDay = () => {
      const now = new Date();
      const lastResetKey = 'lastSystemResetDate';
      const lastResetDate = localStorage.getItem(lastResetKey) || '';
      const currentDate = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
      
      if (lastResetDate !== currentDate && !forceResetTriggeredRef.current) {
        console.log("[Scheduler] Nouveau jour détecté! Réinitialisation automatique");
        localStorage.setItem(lastResetKey, currentDate);
        
        // Forcer la réinitialisation
        handleForceReset(new CustomEvent('balance:force-reset', {
          detail: { reason: 'new-day-auto' }
        }));
      }
    };
    
    // Exécuter la vérification immédiatement
    checkNewDay();
    
    // Programmer des vérifications régulières
    const dailyCheckInterval = setInterval(checkNewDay, 5 * 60000); // Vérifier toutes les 5 minutes

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(autoSessionInterval);
      clearInterval(dailyCheckInterval);
      if (globalBalanceSyncRef.current) clearInterval(globalBalanceSyncRef.current);
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('balance:local-update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-sync' as any, handleForceSyncBalance);
      window.removeEventListener('balance:force-reset' as any, handleForceReset);
    };
  }, [isBotActive, userData.subscription, generateAutomaticRevenue, todaysGainsRef]);

  // Exposer les valeurs de référence de manière sécurisée
  return {
    lastAutoSessionTime: lastAutoSessionTimeRef.current,
    getLastAutoSessionTime: () => lastAutoSessionTimeRef.current,
    isInitialSessionExecuted: () => initialSessionExecutedRef.current,
    getCurrentPersistentBalance: () => Math.max(persistentBalanceRef.current, highestBalanceRef.current),
    forceSystemReset: (reason: string = 'manual') => {
      window.dispatchEvent(new CustomEvent('balance:force-reset', {
        detail: { reason }
      }));
    }
  };
};
