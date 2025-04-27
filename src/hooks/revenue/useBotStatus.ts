
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

export const useBotStatus = (limitReached: boolean) => {
  const [isBotActive, setIsBotActive] = useState(true);

  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        if (isActive && limitReached) {
          console.log("Bot cannot be activated: limit already reached");
          toast({
            title: "Bot inactif",
            description: "Le robot ne peut pas être activé: limite quotidienne atteinte.",
            variant: "destructive"
          });
          return;
        }
        
        console.log(`Bot status update: ${isActive ? 'active' : 'inactive'}`);
        setIsBotActive(isActive);
        localStorage.setItem('botActive', isActive.toString());
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('bot:external-status-change' as any, handleBotStatusChange);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:external-status-change' as any, handleBotStatusChange);
    };
  }, [limitReached]);

  return { isBotActive, setIsBotActive };
};
