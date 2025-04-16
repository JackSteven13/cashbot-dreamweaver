
import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import balanceManager from '@/utils/balance/balanceManager';

export const useMidnightReset = () => {
  useEffect(() => {
    // Function to check if we need to reset counters
    const checkAndResetCounters = () => {
      const now = new Date();
      const lastResetDate = localStorage.getItem('lastResetDate');
      const today = now.toISOString().split('T')[0];
      
      // If we haven't reset today yet, reset counters
      if (lastResetDate !== today) {
        console.log("Resetting daily counters due to new day");
        
        // Reset daily counters
        balanceManager.resetDailyCounters();
        
        // Store reset date
        localStorage.setItem('lastResetDate', today);
        
        // Notify user
        toast({
          title: "Nouvelle journée",
          description: "Vos compteurs quotidiens ont été réinitialisés.",
          duration: 5000,
        });
        
        // Broadcast reset event
        window.dispatchEvent(new CustomEvent('dailyCounters:reset'));
      }
    };
    
    // Check on initial load
    checkAndResetCounters();
    
    // Set up interval to check periodically
    const intervalId = setInterval(checkAndResetCounters, 60000); // Check every minute
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);
};

export default useMidnightReset;
