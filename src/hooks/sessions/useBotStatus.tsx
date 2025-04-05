
import { useState, useEffect } from 'react';

/**
 * Hook for managing bot active status
 */
export const useBotStatus = (initialState: boolean = true) => {
  const [botActive, setBotActive] = useState(initialState);

  // Écouteur d'événements pour synchroniser l'état du bot à travers l'application
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        setBotActive(isActive);
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
    };
  }, []);

  // Function to update bot status and notify the app
  const updateBotStatus = (isActive: boolean) => {
    setBotActive(isActive);
    window.dispatchEvent(new CustomEvent('bot:status-change', { 
      detail: { active: isActive } 
    }));
  };

  return {
    isBotActive: botActive,
    updateBotStatus,
    resetBotActivity: () => updateBotStatus(true)
  };
};
