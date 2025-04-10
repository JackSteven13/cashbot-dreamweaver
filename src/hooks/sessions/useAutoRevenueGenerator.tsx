
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
    }
  }, [userData, checkLimitAndUpdateBot]);

  // Écouter les changements explicites d'état du bot
  useEffect(() => {
    // Si le bot est désactivé manuellement ailleurs, propager l'info
    const handleExternalBotChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      
      // Si on essaie d'activer le bot, vérifier la limite
      if (typeof isActive === 'boolean' && isActive) {
        const dailyLimit = getDailyLimit();
        const currentBalance = getCurrentBalance();
        
        // Si la limite est atteinte, empêcher l'activation
        if (currentBalance >= dailyLimit) {
          console.log("[useAutoRevenueGenerator] Bot activation prevented: limit reached");
          setShowLimitAlert(true);
          updateBotStatus(false);
        } else {
          updateBotStatus(isActive);
        }
      } else if (typeof isActive === 'boolean') {
        // Si on désactive, le faire sans vérification
        updateBotStatus(isActive);
      }
    };
    
    window.addEventListener('bot:external-status-change' as any, handleExternalBotChange);
    
    return () => {
      window.removeEventListener('bot:external-status-change' as any, handleExternalBotChange);
    };
  }, [updateBotStatus, getDailyLimit, getCurrentBalance, setShowLimitAlert]);

  return {
    generateAutomaticRevenue,
    isSessionInProgress: () => isSessionInProgress(),
    isBotActive,
    updateBotStatus,
    resetBotActivity: () => resetBotActivity(userData.subscription, userData.balance)
  };
};
