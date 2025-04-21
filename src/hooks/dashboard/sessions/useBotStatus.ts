
import { useEffect, useState } from 'react';

export const useBotStatus = () => {
  const [isBotActive, setIsBotActive] = useState(true);

  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const active = event.detail?.active;
      if (typeof active === 'boolean') {
        setIsBotActive(active);
      }
    };

    window.addEventListener('bot:status-change' as any, handleBotStatusChange);

    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
    };
  }, []);

  return { isBotActive };
};
