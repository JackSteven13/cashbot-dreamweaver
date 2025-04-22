
import { useEffect } from 'react';
import { shouldResetDailyCounters } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';

export const useDailyReset = () => {
  useEffect(() => {
    const checkAndResetDaily = () => {
      // Check if daily reset is needed
      const shouldReset = shouldResetDailyCounters();
      
      if (shouldReset) {
        console.log("Daily reset triggered");
        
        // Reset daily gains
        if (typeof balanceManager.setDailyGains === 'function') {
          balanceManager.setDailyGains(0);
        } else {
          // Fallback: directly set localStorage
          localStorage.setItem('dailyGains', '0');
        }
        
        // Reset session limits
        localStorage.removeItem('freemium_daily_limit_reached');
        localStorage.removeItem('last_session_date');
        localStorage.removeItem('dailySessionCount');
        
        // Dispatch event to notify components
        window.dispatchEvent(new CustomEvent('dailyReset:completed', {
          detail: { timestamp: new Date().toISOString() }
        }));
        
        return true;
      }
      
      return false;
    };
    
    // Check immediately when component mounts
    checkAndResetDaily();
    
    // Set up interval to check periodically
    const intervalId = setInterval(checkAndResetDaily, 60000); // Check every minute
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  const forceReset = () => {
    console.log("Forcing daily reset");
    
    // Reset daily gains
    if (typeof balanceManager.setDailyGains === 'function') {
      balanceManager.setDailyGains(0);
    } else {
      // Fallback
      localStorage.setItem('dailyGains', '0');
    }
    
    // Reset session limits
    localStorage.removeItem('freemium_daily_limit_reached');
    localStorage.removeItem('last_session_date');
    localStorage.removeItem('dailySessionCount');
    
    // Update last reset date
    localStorage.setItem('lastResetTime', new Date().toISOString());
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('dailyReset:forced', {
      detail: { timestamp: new Date().toISOString() }
    }));
    
    return true;
  };
  
  return { forceReset };
};
