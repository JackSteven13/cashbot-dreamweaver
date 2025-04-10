
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
      
      // Configurer la vérification de réinitialisation à minuit
      const checkMidnightReset = () => {
        const now = new Date();
        // Si c'est un nouveau jour (00:00-00:05), réinitialiser l'activité du bot
        if (now.getHours() === 0 && now.getMinutes() < 5) {
          console.log("MINUIT DÉTECTÉ - Réinitialisation du bot et des limites!");
          resetBotActivity();
          todaysGainsRef.current = 0;
          
          // Forcer l'activation du bot
          updateBotStatus(true);
          
          // Démarrer une session après la réinitialisation
          setTimeout(() => {
            if (isBotActive) {
              console.log("Démarrage d'une première session après réinitialisation");
              generateAutomaticRevenue(true);
            }
          }, 3000);
        }
      };
      
      // Exécuter la vérification immédiatement pour traiter les cas où l'app redémarre juste après minuit
      checkMidnightReset();
      
      // Configurer l'intervalle pour vérifier régulièrement
      const midnightCheckInterval = setInterval(checkMidnightReset, 60000);
      
      return () => {
        clearInterval(midnightCheckInterval);
      };
    }
  }, [userData, checkLimitAndUpdateBot, resetBotActivity, isBotActive, generateAutomaticRevenue]);

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
          
          // Si on active le bot, lancer une session après un court délai
          if (isActive) {
            setTimeout(() => {
              console.log("Bot activé - démarrage d'une première session");
              generateAutomaticRevenue(true);
            }, 2000);
          }
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
  }, [updateBotStatus, getDailyLimit, getCurrentBalance, setShowLimitAlert, generateAutomaticRevenue]);

  return {
    generateAutomaticRevenue,
    isSessionInProgress: () => isSessionInProgress(),
    isBotActive,
    updateBotStatus,
    resetBotActivity: () => resetBotActivity(userData.subscription, userData.balance)
  };
};
