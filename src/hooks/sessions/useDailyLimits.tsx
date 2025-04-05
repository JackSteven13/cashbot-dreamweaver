
import { useEffect, useRef } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

/**
 * Hook for managing daily limit tracking and resets
 * @param userData User data object
 * @returns Today's gains reference and day change tracking
 */
export const useDailyLimits = (userData: any) => {
  // Track today's auto-generated gains
  const todaysGainsRef = useRef(0);
  
  // Calculate today's gains from transactions
  useEffect(() => {
    if (userData?.transactions) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const todaysAutoTransactions = userData.transactions.filter((tx: any) => 
        tx.date.startsWith(today) && 
        tx.gain > 0
      );
      
      todaysGainsRef.current = todaysAutoTransactions.reduce((sum: number, tx: any) => sum + tx.gain, 0);
      console.log("Today's total gains:", todaysGainsRef.current);
    }
  }, [userData?.transactions]);
  
  // Reset daily counters on day change
  useEffect(() => {
    const checkDayChange = () => {
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const storedDate = localStorage.getItem('lastAutoSessionDate');
      if (storedDate) {
        const [year, month, day] = storedDate.split('-').map(Number);
        
        if (year !== currentYear || month !== currentMonth || day !== currentDay) {
          console.log("New day detected, resetting auto session counters");
          todaysGainsRef.current = 0;
          localStorage.setItem('lastAutoSessionDate', 
            `${currentYear}-${currentMonth}-${currentDay}`);
        }
      } else {
        localStorage.setItem('lastAutoSessionDate', 
          `${currentYear}-${currentMonth}-${currentDay}`);
      }
    };
    
    // Check on component mount
    checkDayChange();
    
    // Set up interval to check (every 5 minutes)
    const dayCheckInterval = setInterval(checkDayChange, 5 * 60 * 1000);
    
    return () => {
      clearInterval(dayCheckInterval);
    };
  }, []);

  /**
   * Get daily limit for the current subscription
   */
  const getDailyLimit = () => {
    return SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  };

  return {
    todaysGainsRef,
    getDailyLimit
  };
};
