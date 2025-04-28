
import { useState, useEffect } from 'react';

export const useBotStatus = (initialLimitReached: boolean = false) => {
  // Toujours initialiser le bot comme actif par défaut
  const [isBotActive, setIsBotActive] = useState(true);

  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        setIsBotActive(isActive);
      }
    };
    
    // Annoncer que le bot est actif au démarrage
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('bot:status-change', { 
        detail: { active: true } 
      }));
    }, 500);
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
    };
  }, []);

  return {
    isBotActive,
    setIsBotActive: (status: boolean) => {
      setIsBotActive(status);
      window.dispatchEvent(new CustomEvent('bot:status-change', { 
        detail: { active: status } 
      }));
    },
    activityLevel: 1
  };
};

export default useBotStatus;
