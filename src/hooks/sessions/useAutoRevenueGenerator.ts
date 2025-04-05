
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSessionOperations } from './useSessionOperations';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

/**
 * Hook pour gérer la génération automatique de revenus
 */
export const useAutoRevenueGenerator = (
  userData: any,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void,
  todaysGainsRef: React.MutableRefObject<number>,
  getDailyLimit: () => number
) => {
  // Garder l'état actif du bot dans un state
  const [isBotActive, setIsBotActive] = useState(true);
  const botStatusRef = useRef<boolean>(true);
  const initialSyncDoneRef = useRef<boolean>(false);
  
  // Synchroniser l'état du bot avec le localStorage
  useEffect(() => {
    try {
      // Au montage, vérifier si l'état du bot est stocké dans localStorage
      const storedBotStatus = localStorage.getItem('botActive');
      
      // Ne mettre à jour que si l'état est explicitement défini à "false"
      if (storedBotStatus === 'false') {
        botStatusRef.current = false;
        setIsBotActive(false);
      } else {
        // Par défaut, le bot est actif
        botStatusRef.current = true;
        setIsBotActive(true);
        // S'assurer que localStorage est à jour
        localStorage.setItem('botActive', 'true');
      }
    } catch (e) {
      console.error("Failed to read bot status from localStorage:", e);
    }
    
    // Écouter les changements externes d'état du bot
    const handleExternalBotChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        console.log(`[AutoRevGenerator] External bot status change: ${isActive}`);
        botStatusRef.current = isActive;
        setIsBotActive(isActive);
        
        // Persister le changement
        localStorage.setItem('botActive', isActive.toString());
        
        // Propager le changement à tous les composants
        window.dispatchEvent(new CustomEvent('bot:status-change', { 
          detail: { active: isActive }
        }));
      }
    };
    
    // Au premier montage, déclencher un événement de synchronisation
    if (!initialSyncDoneRef.current) {
      window.dispatchEvent(new CustomEvent('bot:status-change', { 
        detail: { active: botStatusRef.current }
      }));
      initialSyncDoneRef.current = true;
    }
    
    window.addEventListener('bot:external-status-change' as any, handleExternalBotChange);
    
    return () => {
      window.removeEventListener('bot:external-status-change' as any, handleExternalBotChange);
    };
  }, []);
  
  // Fonction pour réinitialiser l'état du bot
  const resetBotActivity = useCallback(() => {
    console.log("[AutoRevGenerator] Resetting bot activity state to active");
    botStatusRef.current = true;
    setIsBotActive(true);
    localStorage.setItem('botActive', 'true');
    
    // Propager le changement
    window.dispatchEvent(new CustomEvent('bot:status-change', { 
      detail: { active: true }
    }));
  }, []);
  
  // Fonction pour mettre à jour l'état du bot
  const updateBotStatus = useCallback((isActive: boolean) => {
    if (botStatusRef.current !== isActive) {
      console.log(`[AutoRevGenerator] Updating bot status to: ${isActive}`);
      botStatusRef.current = isActive;
      setIsBotActive(isActive);
      localStorage.setItem('botActive', isActive.toString());
      
      // Propager le changement
      window.dispatchEvent(new CustomEvent('bot:status-change', { 
        detail: { active: isActive }
      }));
    }
  }, []);
  
  // Utiliser le hook pour les opérations de session
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
  
  return {
    generateAutomaticRevenue,
    isSessionInProgress,
    isBotActive,
    resetBotActivity,
    updateBotStatus,
    getCurrentBalance
  };
};

export default useAutoRevenueGenerator;
