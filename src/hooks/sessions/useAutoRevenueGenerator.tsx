
import { useRef, useEffect } from 'react';
import { useBotStatus } from './useBotStatus';
import { useSessionOperations } from './useSessionOperations';
import { UserData } from '@/types/userData';

export const useAutoRevenueGenerator = (
  userData: UserData,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void,
  todaysGainsRef: React.MutableRefObject<number>,
  getDailyLimit: () => number
) => {
  const isInitialMount = useRef(true);
  const lastBotResetRef = useRef<number>(Date.now());

  // Utiliser le hook de gestion d'état du bot avec vérification de limite
  const { 
    isBotActive, 
    updateBotStatus, 
    resetBotActivity, 
    checkLimitAndUpdateBot 
  } = useBotStatus(true);

  // Intégrer les opérations de session
  const { 
    generateAutomaticRevenue, 
    isSessionInProgress, 
    getCurrentBalance 
  } = useSessionOperations(
    userData,
    updateBalance,
    setShowLimitAlert,
    todaysGainsRef,
    getDailyLimit,
    isBotActive,
    updateBotStatus
  );

  // Vérifier la limite au montage et désactiver le bot si nécessaire
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      // Vérifier si la limite est déjà atteinte au montage
      if (userData?.subscription && userData?.balance !== undefined) {
        // Utiliser l'API du hook pour vérifier et mettre à jour l'état du bot
        checkLimitAndUpdateBot(userData.subscription, userData.balance);
      }
      
      // Vérifier si nous avons passé minuit depuis la dernière réinitialisation
      const now = new Date();
      const lastResetTimeStr = localStorage.getItem('lastResetTime');
      const lastResetTime = lastResetTimeStr ? parseInt(lastResetTimeStr, 10) : 0;
      
      if (lastResetTime > 0) {
        const lastReset = new Date(lastResetTime);
        
        // Si le dernier reset était avant aujourd'hui, réactiver le bot
        if (lastReset.getDate() !== now.getDate() || 
            lastReset.getMonth() !== now.getMonth() || 
            lastReset.getFullYear() !== now.getFullYear()) {
          
          console.log("[AutoRevGenerator] Nouveau jour détecté, réactivation du bot");
          updateBotStatus(true);
          
          // Mettre à jour la référence
          lastBotResetRef.current = Date.now();
          localStorage.setItem('lastBotReset', lastBotResetRef.current.toString());
        }
      }
    }
  }, [userData, checkLimitAndUpdateBot, updateBotStatus]);

  // Écouter les changements explicites d'état du bot
  useEffect(() => {
    // Si le bot est désactivé manuellement ailleurs, propager l'info
    const handleExternalBotChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      
      // Si on essaie d'activer le bot, vérifier la limite
      if (typeof isActive === 'boolean') {
        // Réinitialiser les compteurs de session si activation à minuit
        const now = new Date();
        const isNearMidnight = now.getHours() === 0 && now.getMinutes() < 5;
        
        if (isActive && isNearMidnight) {
          // Forcer la réinitialisation des compteurs à minuit
          console.log("[AutoRevGenerator] Activation à minuit - réinitialisation forcée");
          localStorage.setItem('todaySessionCount', '0');
          todaysGainsRef.current = 0;
        }
        
        if (isActive) {
          const dailyLimit = getDailyLimit();
          const currentBalance = getCurrentBalance();
          
          // Si la limite est atteinte, empêcher l'activation
          if (currentBalance >= dailyLimit) {
            console.log("[useAutoRevenueGenerator] Bot activation prevented: limit reached");
            setShowLimitAlert(true);
            updateBotStatus(false);
          } else {
            updateBotStatus(true);
            console.log("[useAutoRevenueGenerator] Bot activated successfully");
          }
        } else {
          // Si on désactive, le faire sans vérification
          updateBotStatus(false);
          console.log("[useAutoRevenueGenerator] Bot manually deactivated");
        }
      }
    };
    
    window.addEventListener('bot:external-status-change' as any, handleExternalBotChange);
    
    // Aussi vérifier périodiquement l'état du bot après minuit
    const checkMidnightActivation = () => {
      const now = new Date();
      
      // Si on est juste après minuit (00:00 - 00:05)
      if (now.getHours() === 0 && now.getMinutes() < 5) {
        // Dernière réinitialisation du bot
        const lastBotResetStr = localStorage.getItem('lastBotReset');
        const lastBotReset = lastBotResetStr ? parseInt(lastBotResetStr, 10) : 0;
        const lastBotResetDate = new Date(lastBotReset);
        
        // Si la dernière réinitialisation n'était pas aujourd'hui
        if (lastBotResetDate.getDate() !== now.getDate() || 
            lastBotResetDate.getMonth() !== now.getMonth() || 
            lastBotResetDate.getFullYear() !== now.getFullYear()) {
          
          console.log("[AutoRevGenerator] Minuit détecté, tentative d'activation du bot");
          window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
            detail: { active: true }
          }));
          
          // Mettre à jour la référence
          lastBotResetRef.current = Date.now();
          localStorage.setItem('lastBotReset', lastBotResetRef.current.toString());
        }
      }
    };
    
    // Vérifier toutes les minutes
    const midnightCheckInterval = setInterval(checkMidnightActivation, 60000);
    
    return () => {
      window.removeEventListener('bot:external-status-change' as any, handleExternalBotChange);
      clearInterval(midnightCheckInterval);
    };
  }, [updateBotStatus, getDailyLimit, getCurrentBalance, setShowLimitAlert, todaysGainsRef]);

  return {
    generateAutomaticRevenue,
    isSessionInProgress: () => isSessionInProgress(),
    isBotActive,
    updateBotStatus,
    resetBotActivity: () => resetBotActivity(userData.subscription, userData.balance)
  };
};
