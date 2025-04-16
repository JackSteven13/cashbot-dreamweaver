
import { useEffect, useRef } from 'react';
import balanceManager from '@/utils/balance/balanceManager';

export const useMidnightReset = () => {
  const resetDate = useRef<string | null>(null);
  
  useEffect(() => {
    // Function to check and perform daily resets
    const checkAndPerformReset = () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we've already reset today
      if (resetDate.current === today) {
        console.log('Reset already happened today, skipping');
        return;
      }
      
      // Perform the reset
      console.log('Performing midnight reset of daily counters');
      balanceManager.resetDailyCounters();
      
      // Update the reset date
      resetDate.current = today;
      
      // Store in localStorage for persistence across refreshes
      try {
        localStorage.setItem('lastResetDate', today);
      } catch (e) {
        console.error('Error storing reset date:', e);
      }
      
      // Dispatch reset event
      window.dispatchEvent(new CustomEvent('dailyReset', { 
        detail: { date: today } 
      }));
    };
    
    // Load the last reset date from storage
    try {
      resetDate.current = localStorage.getItem('lastResetDate');
    } catch (e) {
      console.error('Error loading reset date from storage:', e);
    }
    
    // Check for reset on initial load
    checkAndPerformReset();
    
    // Set up periodic checks (every hour)
    const checkInterval = setInterval(checkAndPerformReset, 3600000);
    
    // Listen for system time changes or waking from sleep
    const visibilityChangeHandler = () => {
      if (document.visibilityState === 'visible') {
        checkAndPerformReset();
      }
    };
    
    document.addEventListener('visibilitychange', visibilityChangeHandler);
    
    return () => {
      clearInterval(checkInterval);
      document.removeEventListener('visibilitychange', visibilityChangeHandler);
    };
  }, []);
  
  // This hook doesn't return anything, it just sets up the reset logic
  return null;
};

export default useMidnightReset;
