
import { useEffect, useRef } from 'react';
import { resetDailyGainsAtMidnight } from '@/utils/balance/persistentGainsTracker';
import { shouldResetDailyCounters } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';

export const useMidnightReset = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedRef = useRef<Date>(new Date());

  // Function to reset counters and storage at midnight
  const resetAtMidnight = () => {
    console.log('Checking if midnight reset is needed...');
    
    // Check if we should reset counters
    const shouldReset = shouldResetDailyCounters();
    
    if (shouldReset) {
      console.log('Midnight detected, resetting counters...');
      
      // Reset daily gains
      resetDailyGainsAtMidnight();
      
      // Reset session counts and limits
      localStorage.removeItem('freemium_daily_limit_reached');
      localStorage.removeItem('last_session_date');
      localStorage.removeItem('dailySessionCount');
      
      // Update our last checked time
      lastCheckedRef.current = new Date();
      
      // Fire event to update UI components
      window.dispatchEvent(new CustomEvent('dailyReset:completed', {
        detail: { timestamp: Date.now() }
      }));
      
      // Log reset
      console.log('Daily reset completed at', new Date().toISOString());
      
      return true;
    }
    
    return false;
  };

  // Setup interval to check for midnight reset
  useEffect(() => {
    // Initial check in case the app loads right after midnight
    resetAtMidnight();
    
    // Set interval to check every minute
    intervalRef.current = setInterval(() => {
      resetAtMidnight();
    }, 60000); // Check every minute
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Additional useEffect to handle when device wakes from sleep
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = new Date();
        const lastChecked = lastCheckedRef.current;
        
        // If it's been more than 5 minutes since our last check
        if (now.getTime() - lastChecked.getTime() > 5 * 60 * 1000) {
          console.log('App resumed from background, checking for reset...');
          resetAtMidnight();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Function to force a reset (for testing or manual resets)
  const forceReset = () => {
    console.log('Forcing daily reset...');
    
    // Reset daily gains in the balance manager
    if (typeof balanceManager.setDailyGains === 'function') {
      balanceManager.setDailyGains(0);
    } else {
      // Fallback
      localStorage.setItem('dailyGains', '0');
    }
    
    // Reset other storage items
    localStorage.removeItem('freemium_daily_limit_reached');
    localStorage.removeItem('last_session_date');
    localStorage.removeItem('dailySessionCount');
    localStorage.setItem('lastDailyGainsReset', new Date().toISOString().split('T')[0]);
    
    // Fire reset event
    window.dispatchEvent(new CustomEvent('dailyReset:forced', {
      detail: { timestamp: Date.now() }
    }));
    
    return true;
  };

  return { forceReset };
};

export default useMidnightReset;
