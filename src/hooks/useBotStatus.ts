
import { useState, useEffect, useCallback } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

/**
 * Hook to manage bot status and activity level
 */
export const useBotStatus = () => {
  const [isBotActive, setIsBotActive] = useState(false);
  const [activityLevel, setActivityLevel] = useState(50); // Default activity level (0-100)
  
  // Initialize bot status from localStorage if available
  useEffect(() => {
    const storedStatus = localStorage.getItem('botStatus');
    if (storedStatus) {
      setIsBotActive(storedStatus === 'active');
    }
    
    // Get activity level if available, or generate random one
    const storedLevel = localStorage.getItem('botActivityLevel');
    if (storedLevel) {
      setActivityLevel(parseInt(storedLevel, 10) || 50);
    } else {
      // Random activity between 40-70
      const randomLevel = 40 + Math.floor(Math.random() * 31);
      setActivityLevel(randomLevel);
      localStorage.setItem('botActivityLevel', randomLevel.toString());
    }
  }, []);
  
  // Update bot status
  const updateBotStatus = useCallback((active: boolean, subscription?: string, currentBalance?: number) => {
    setIsBotActive(active);
    localStorage.setItem('botStatus', active ? 'active' : 'inactive');
    
    // If active, update activity level slightly
    if (active) {
      setActivityLevel(prev => {
        // Slightly vary activity level (±5)
        const newLevel = Math.max(10, Math.min(90, prev + (Math.random() * 10 - 5)));
        localStorage.setItem('botActivityLevel', Math.round(newLevel).toString());
        return newLevel;
      });
    }
  }, []);
  
  // Reset bot activity level
  const resetBotActivity = useCallback((subscription: string, currentBalance: number) => {
    // Check daily limits
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Higher activity for paid users
    let newLevel = subscription === 'freemium' ? 50 : 65;
    
    // Adjust based on limit proximity
    if (currentBalance >= dailyLimit * 0.8) {
      newLevel = Math.max(10, newLevel * 0.5); // Reduce activity near limit
    }
    
    // Set the new level
    setActivityLevel(newLevel);
    localStorage.setItem('botActivityLevel', Math.round(newLevel).toString());
    return true;
  }, []);
  
  // Check limit and update bot status if needed
  const checkLimitAndUpdateBot = useCallback((subscription: string, currentBalance: number) => {
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // If balance exceeds limit, deactivate bot
    if (currentBalance >= dailyLimit) {
      setIsBotActive(false);
      localStorage.setItem('botStatus', 'inactive');
      return false;
    }
    
    return true;
  }, []);
  
  return {
    isBotActive,
    activityLevel,
    updateBotStatus,
    resetBotActivity,
    checkLimitAndUpdateBot
  };
};
