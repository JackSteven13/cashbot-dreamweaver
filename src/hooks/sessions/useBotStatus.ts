
import { useState, useEffect, useCallback } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

export const useBotStatus = (initialState: boolean = true) => {
  const [isBotActive, setBotActive] = useState(initialState);
  
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
        setBotActive(savedStatus === 'true');
      }
    } catch (error) {
      console.error('Failed to load bot status:', error);
    }
  }, []);
  
  // Vérifier si la limite est atteinte et désactiver automatiquement le bot le cas échéant
  const checkLimitAndUpdateBot = useCallback((subscription: string, currentBalance: number) => {
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    if (currentBalance >= dailyLimit && isBotActive) {
      console.log(`Limite journalière atteinte (${currentBalance}/${dailyLimit}). Désactivation forcée du bot.`);
      setBotActive(false);
      
      // Propager le changement
      window.dispatchEvent(new CustomEvent('bot:status-change', {
        detail: { active: false }
      }));
      
      return false;
    }
    
    return true;
  }, [isBotActive]);
  
  // Écouter les événements externes de changement d'état du bot
  useEffect(() => {
    const handleExternalStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      const forceLimitCheck = event.detail?.checkLimit;
      const subscription = event.detail?.subscription;
      const currentBalance = event.detail?.balance;
      
      if (typeof isActive === 'boolean') {
        // Si on essaie d'activer le bot alors que la limite est atteinte, bloquer l'activation
        if (isActive && forceLimitCheck && subscription && currentBalance !== undefined) {
          const canActivate = checkLimitAndUpdateBot(subscription, currentBalance);
          
          // Uniquement mettre à jour si l'activation est permise ou si on demande une désactivation
          if (canActivate || !isActive) {
            setBotActive(isActive);
          }
        } else {
          setBotActive(isActive);
        }
      }
    };
    
    window.addEventListener('bot:external-status-change' as any, handleExternalStatusChange);
    
    return () => {
      window.removeEventListener('bot:external-status-change' as any, handleExternalStatusChange);
    };
  }, [isBotActive, checkLimitAndUpdateBot]);
  
  // Réinitialiser l'activité du bot
  const resetBotActivity = useCallback((subscription: string, currentBalance: number) => {
    // Vérifier d'abord si la limite est atteinte
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    if (currentBalance >= dailyLimit) {
      console.log('Tentative de réactivation du bot bloquée : limite journalière atteinte');
      return false;
    }
    
    setBotActive(true);
    
    // Propager le changement
    window.dispatchEvent(new CustomEvent('bot:status-change', {
      detail: { active: true }
    }));
    
    console.log('Bot activity reset to active');
    return true;
  }, []);
  
  // Mettre à jour le statut du bot
  const updateBotStatus = useCallback((active: boolean, subscription?: string, currentBalance?: number) => {
    // Si on tente d'activer le bot et qu'on a des infos sur l'abonnement et le solde
    if (active && subscription && currentBalance !== undefined) {
      // Vérifier si la limite est atteinte
      const canActivate = checkLimitAndUpdateBot(subscription, currentBalance);
      
      // Ne mettre à jour que si l'activation est permise ou si on demande une désactivation
      if (canActivate) {
        setBotActive(active);
      }
    } else {
      // Si on désactive ou si on n'a pas d'infos sur l'abonnement/solde
      setBotActive(active);
    }
  }, [checkLimitAndUpdateBot]);
  
  return {
    isBotActive,
    updateBotStatus,
    resetBotActivity,
    checkLimitAndUpdateBot
  };
};
