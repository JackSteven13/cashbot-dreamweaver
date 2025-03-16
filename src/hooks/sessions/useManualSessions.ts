
import { useState, useRef, useEffect } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { 
  SUBSCRIPTION_LIMITS, 
  checkDailyLimit, 
  canStartManualSession,
  calculateManualSessionGain 
} from '@/utils/subscriptionUtils';

export const useManualSessions = (
  userData: UserData,
  dailySessionCount: number,
  incrementSessionCount: () => Promise<void>,
  updateBalance: (gain: number, report: string) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void
) => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const sessionInProgress = useRef(false);
  const operationLock = useRef(false);
  const clickTimeoutRef = useRef<number | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleStartSession = async () => {
    // Debounce rapid clicks - ignore if clicked within last 2 seconds
    if (clickTimeoutRef.current !== null) {
      console.log("Ignoring rapid click, debouncing active");
      return;
    }
    
    // Prevent multiple concurrent sessions and rapid clicking
    if (isStartingSession || sessionInProgress.current || operationLock.current) {
      console.log("Session or operation already in progress, ignoring request");
      return;
    }
    
    // Set click debounce
    clickTimeoutRef.current = window.setTimeout(() => {
      clickTimeoutRef.current = null;
    }, 2000);
    
    // Check if session can be started
    if (!canStartManualSession(userData.subscription, dailySessionCount, userData.balance)) {
      // If freemium account and session limit reached
      if (userData.subscription === 'freemium' && dailySessionCount >= 1) {
        toast({
          title: "Limite de sessions atteinte",
          description: "Votre abonnement Freemium est limité à 1 session manuelle par jour. Passez à un forfait supérieur pour plus de sessions.",
          variant: "destructive"
        });
        return;
      }
      
      // If daily gain limit reached
      if (checkDailyLimit(userData.balance, userData.subscription)) {
        setShowLimitAlert(true);
        toast({
          title: "Limite journalière atteinte",
          description: `Vous avez atteint votre limite de gain journalier de ${SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS]}€. Revenez demain ou passez à un forfait supérieur.`,
          variant: "destructive"
        });
        return;
      }
    }
    
    try {
      // Set all locks and flags
      operationLock.current = true;
      sessionInProgress.current = true;
      setIsStartingSession(true);
      
      // Increment daily session count for freemium accounts
      if (userData.subscription === 'freemium') {
        await incrementSessionCount();
      }
      
      // Simulate manual session
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Calculate gain using the utility function
      const randomGain = calculateManualSessionGain(
        userData.subscription, 
        userData.balance, 
        userData.referrals.length
      );
      
      // Update user data
      await updateBalance(
        randomGain,
        `Session manuelle : Notre technologie a optimisé le processus et généré ${randomGain.toFixed(2)}€ de revenus pour votre compte ${userData.subscription}.`
      );
      
      toast({
        title: "Session terminée",
        description: `CashBot a généré ${randomGain.toFixed(2)}€ de revenus pour vous !`,
      });
    } catch (error) {
      console.error("Error during session:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue pendant la session. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      setIsStartingSession(false);
      sessionInProgress.current = false;
      // Release operation lock after a delay to prevent rapid clicking
      setTimeout(() => {
        operationLock.current = false;
      }, 1000);
    }
  };

  return {
    isStartingSession,
    handleStartSession
  };
};

export default useManualSessions;
