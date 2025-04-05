
import { useState, useEffect } from 'react';

export const useBotStatus = (initialState: boolean = true) => {
  const [isBotActive, setIsBotActive] = useState(initialState);
  
  // Effectuer des actions lorsque le statut du bot change
  useEffect(() => {
    // Propager l'état du bot à travers l'application
    window.dispatchEvent(new CustomEvent('bot:status-change', {
      detail: { active: isBotActive }
    }));
    
    console.log(`Bot status changed to ${isBotActive ? 'active' : 'inactive'}`);
    
    // Sauvegarder l'état dans localStorage pour la persistance
    try {
      localStorage.setItem('botActive', String(isBotActive));
    } catch (error) {
      console.error('Failed to store bot status:', error);
    }
  }, [isBotActive]);
  
  // Charger l'état initial depuis localStorage
  useEffect(() => {
    try {
      const savedStatus = localStorage.getItem('botActive');
      if (savedStatus !== null) {
        setIsBotActive(savedStatus === 'true');
      }
    } catch (error) {
      console.error('Failed to load bot status:', error);
    }
  }, []);
  
  // Écouter les événements externes de changement d'état du bot
  useEffect(() => {
    const handleExternalStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean' && isActive !== isBotActive) {
        setIsBotActive(isActive);
      }
    };
    
    window.addEventListener('bot:external-status-change' as any, handleExternalStatusChange);
    
    return () => {
      window.removeEventListener('bot:external-status-change' as any, handleExternalStatusChange);
    };
  }, [isBotActive]);
  
  // Réinitialiser l'activité du bot
  const resetBotActivity = () => {
    setIsBotActive(true);
    
    // Propager le changement
    window.dispatchEvent(new CustomEvent('bot:status-change', {
      detail: { active: true }
    }));
    
    console.log('Bot activity reset to active');
  };
  
  // Mettre à jour le statut du bot
  const updateBotStatus = (active: boolean) => {
    if (active !== isBotActive) {
      setIsBotActive(active);
    }
  };
  
  return {
    isBotActive,
    updateBotStatus,
    resetBotActivity
  };
};
