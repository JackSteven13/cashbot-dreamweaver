
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

export const useBotStatus = (limitReached: boolean) => {
  const [isBotActive, setIsBotActive] = useState(true); // Toujours actif par défaut

  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        setIsBotActive(isActive);
        localStorage.setItem('botActive', isActive.toString());
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('bot:external-status-change' as any, handleBotStatusChange);
    
    // Initialiser à actif au chargement
    setIsBotActive(true);
    localStorage.setItem('botActive', 'true');
    console.log("Bot initialized as active");
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:external-status-change' as any, handleBotStatusChange);
    };
  }, []);

  return { isBotActive, setIsBotActive };
};
