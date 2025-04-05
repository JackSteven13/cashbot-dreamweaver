
import { useEffect, useRef } from 'react';
import { UserData } from '@/types/userData';
import { shouldResetDailyCounters } from '@/utils/subscription';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook to manage daily reset functionality at midnight
 */
export const useMidnightReset = (
  userData: UserData,
  incrementSessionCount: () => Promise<void>,
  updateBalance: (gain: number, report: string) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void
) => {
  const lastResetTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    const checkForDailyReset = () => {
      // Check if we should reset based on last reset time
      if (shouldResetDailyCounters(lastResetTimeRef.current)) {
        console.log("Daily reset triggered by time check");
        performDailyReset();
      }
    };
    
    // Check immediately when the component mounts
    checkForDailyReset();
    
    // Set up an interval to check regularly (every 5 minutes)
    const intervalId = setInterval(checkForDailyReset, 5 * 60 * 1000);
    
    // Specific check at midnight
    const checkAtMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      
      const timeToMidnight = nextMidnight.getTime() - now.getTime();
      
      // Schedule the reset for midnight
      const midnightTimer = setTimeout(() => {
        console.log("Daily reset triggered by midnight timer");
        performDailyReset();
        
        // Set up the next day's timer after this one fires
        checkAtMidnight();
      }, timeToMidnight);
      
      return midnightTimer;
    };
    
    // Set up the initial midnight check
    const midnightTimer = checkAtMidnight();
    
    return () => {
      clearInterval(intervalId);
      clearTimeout(midnightTimer);
    };
  }, []);
  
  const performDailyReset = async () => {
    try {
      // Only hide the limit alert if it's currently shown
      setShowLimitAlert(false);
      
      // Reset the daily session count
      await incrementSessionCount();
      
      // Update the last reset time
      lastResetTimeRef.current = Date.now();
      
      // Display a notification about the reset
      toast({
        title: "Limite journalière réinitialisée",
        description: "Vos gains journaliers ont été réinitialisés. Vous pouvez à nouveau générer des revenus aujourd'hui!",
        action: (
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('dashboard:refresh'))}
            className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded text-xs"
          >
            Générer maintenant
          </button>
        )
      });
      
      // Dispatch an event to refresh the UI
      window.dispatchEvent(new CustomEvent('daily-reset:complete'));
      
    } catch (error) {
      console.error("Error during daily reset:", error);
    }
  };

  return { performDailyReset };
};
