
import { useCallback } from 'react';
import { toast } from "@/components/ui/use-toast";
import balanceManager from '@/utils/balance/balanceManager';

interface UseBoostSessionProps {
  userData: any;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  incrementSessionCount: () => Promise<void>;
  setShowLimitAlert: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useBoostSession = ({
  userData,
  updateBalance,
  incrementSessionCount,
  setShowLimitAlert
}: UseBoostSessionProps) => {
  const handleBoostSession = useCallback(async () => {
    try {
      const currentGains = balanceManager.getDailyGains();
      
      if (currentGains >= 0.5 && userData?.subscription === 'freemium') {
        setShowLimitAlert(true);
        return;
      }
      
      await incrementSessionCount();
      await updateBalance(0.1, "Session boost", true);
    } catch (error) {
      console.error("Failed to boost session:", error);
      toast({
        title: "Erreur",
        description: "Impossible de booster la session.",
        variant: "destructive"
      });
    }
  }, [userData, updateBalance, incrementSessionCount, setShowLimitAlert]);

  return { handleBoostSession };
};
