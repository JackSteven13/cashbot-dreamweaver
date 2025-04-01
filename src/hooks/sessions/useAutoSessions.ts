import { useState, useEffect, useRef } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { 
  checkDailyLimit, 
  calculateAutoSessionGain
} from '@/utils/subscription';

export const useAutoSessions = (
  userData: UserData,
  updateBalance: (gain: number, report: string) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void
) => {
  const [lastAutoSessionTime, setLastAutoSessionTime] = useState(Date.now());
  const sessionInProgress = useRef(false);
  const operationLock = useRef(false);

  // Effect for simulating automatic ad analysis
  useEffect(() => {
    const autoSessionInterval = setInterval(() => {
      // Check if 5 minutes have passed since last session and daily limit not reached
      if (Date.now() - lastAutoSessionTime >= 300000 && !checkDailyLimit(userData.balance, userData.subscription)) {
        generateAutomaticRevenue();
        setLastAutoSessionTime(Date.now());
      }
    }, 60000); // Check every minute

    return () => clearInterval(autoSessionInterval);
  }, [lastAutoSessionTime, userData.subscription, userData.balance]);

  const generateAutomaticRevenue = async () => {
    if (sessionInProgress.current || operationLock.current) return;
    
    try {
      operationLock.current = true;
      sessionInProgress.current = true;
      
      // Calculate gain using the utility function
      const randomGain = calculateAutoSessionGain(
        userData.subscription, 
        userData.balance, 
        userData.referrals.length
      );
      
      // If no gain was generated (due to limit being reached), show alert
      if (randomGain <= 0) {
        setShowLimitAlert(true);
        return;
      }
      
      // Update user balance and show notification
      await updateBalance(
        randomGain,
        `Le système a généré ${randomGain.toFixed(2)}€ de revenus grâce à notre technologie propriétaire. Votre abonnement ${userData.subscription} vous permet d'accéder à ce niveau de performance.`
      );

      // Always show notification regardless of user status
      toast({
        title: "Revenus générés",
        description: `CashBot a généré ${randomGain.toFixed(2)}€ pour vous !`,
      });
    } catch (error) {
      console.error("Error generating automatic revenue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      sessionInProgress.current = false;
      // Release lock after a small delay to prevent rapid subsequent calls
      setTimeout(() => {
        operationLock.current = false;
      }, 500);
    }
  };

  return {
    lastAutoSessionTime,
    setLastAutoSessionTime
  };
};
