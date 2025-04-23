
import { useEffect, useRef } from 'react';
import { shouldResetDailyCounters } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';
import { toast } from '@/components/ui/use-toast';

export const useDailyReset = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedRef = useRef<Date>(new Date());
  const midnightTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to reset counters and storage at midnight
  const resetAtMidnight = () => {
    console.log('Checking if midnight reset is needed...');
    
    // Check if we should reset counters
    const shouldReset = shouldResetDailyCounters();
    
    if (shouldReset) {
      console.log('Midnight detected, resetting counters...');
      
      // Reset daily gains to zero
      if (typeof balanceManager.setDailyGains === 'function') {
        balanceManager.setDailyGains(0);
      } else {
        // Fallback: directly set localStorage
        localStorage.setItem('dailyGains', '0');
      }
      
      // Reset session counts and limits
      localStorage.removeItem('freemium_daily_limit_reached');
      localStorage.removeItem('last_session_date');
      localStorage.removeItem('dailySessionCount');
      
      // Update last reset date
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      localStorage.setItem('lastDailyGainsReset', today);
      
      // Fire event to update UI components
      window.dispatchEvent(new CustomEvent('dailyReset:completed', {
        detail: { timestamp: Date.now() }
      }));
      
      // Log reset
      console.log('Daily reset completed at', new Date().toISOString());

      // Show a notification to inform the user
      toast({
        title: "Compteurs quotidiens réinitialisés",
        description: "Une nouvelle journée commence! Vos limites quotidiennes ont été réinitialisées.",
        duration: 5000
      });
      
      return true;
    }
    
    return false;
  };

  // Setup timer to check for midnight reset and schedule next day
  const setupMidnightTimer = () => {
    // Clear any existing timer
    if (midnightTimerRef.current) {
      clearTimeout(midnightTimerRef.current);
    }
    
    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeToMidnight = tomorrow.getTime() - now.getTime();
    console.log(`Next midnight reset in ${Math.floor(timeToMidnight / 60000)} minutes`);
    
    // Set timer for next midnight
    midnightTimerRef.current = setTimeout(() => {
      resetAtMidnight();
      // Setup the timer for the next day
      setupMidnightTimer();
    }, timeToMidnight);
  };

  // Setup interval to check for midnight reset
  useEffect(() => {
    // Initial check in case the app loads right after midnight
    resetAtMidnight();
    
    // Set interval to check every minute
    intervalRef.current = setInterval(() => {
      resetAtMidnight();
    }, 60000); // Check every minute
    
    // Setup the precise midnight timer
    setupMidnightTimer();
    
    return () => {
      // Clean up both timers
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (midnightTimerRef.current) {
        clearTimeout(midnightTimerRef.current);
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
          // Update the last checked time
          lastCheckedRef.current = now;
          // Reset the midnight timer to be accurate
          setupMidnightTimer();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for app wake from sleep/standby
    window.addEventListener('online', () => {
      console.log('Network connection restored, checking for reset...');
      resetAtMidnight();
      // Update the timer
      setupMidnightTimer();
    });
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', () => {});
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
    
    toast({
      title: "Réinitialisation forcée",
      description: "Les compteurs quotidiens ont été réinitialisés manuellement.",
      duration: 3000
    });
    
    return true;
  };

  return { forceReset, resetAtMidnight };
};

export default useDailyReset;
