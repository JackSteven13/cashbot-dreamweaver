
import { useCallback } from 'react';
import { toast } from "@/components/ui/use-toast";
import balanceManager from '@/utils/balance/balanceManager';

interface UseSessionIncrementProps {
  incrementSessionCount: () => Promise<void>;
}

export const useSessionIncrement = ({ incrementSessionCount }: UseSessionIncrementProps) => {
  const handleIncrementSession = useCallback(async () => {
    try {
      await incrementSessionCount();
      
      // Reset daily gains if needed (for example, at the start of a new day)
      const lastResetDate = localStorage.getItem('lastDailyGainsReset');
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (lastResetDate !== today) {
        balanceManager.setDailyGains(0);
        localStorage.setItem('lastDailyGainsReset', today);
      }
    } catch (error) {
      console.error("Failed to increment session:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'incrémenter le compteur de sessions.",
        variant: "destructive"
      });
    }
  }, [incrementSessionCount]);

  return { handleIncrementSession };
};
