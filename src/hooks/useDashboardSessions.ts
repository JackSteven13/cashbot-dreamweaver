
import { useState, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { 
  SUBSCRIPTION_LIMITS, 
  checkDailyLimit, 
  canStartManualSession,
  calculateManualSessionGain,
  calculateAutoSessionGain
} from '@/utils/subscriptionUtils';
import { UserData } from '@/types/userData';
import { supabase } from "@/integrations/supabase/client";

export const useDashboardSessions = (
  userData: UserData,
  dailySessionCount: number,
  incrementSessionCount: () => Promise<void>,
  updateBalance: (gain: number, report: string) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void,
  resetBalance: () => Promise<void>
) => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [lastAutoSessionTime, setLastAutoSessionTime] = useState(Date.now());
  const sessionInProgress = useRef(false);
  const operationLock = useRef(false);
  const refreshTimeoutRef = useRef<number | null>(null);

  // Clean up any pending timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

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

  // Reset sessions and balances at midnight Paris time
  useEffect(() => {
    const checkMidnightReset = async () => {
      try {
        const now = new Date();
        const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
        
        if (parisTime.getHours() === 0 && parisTime.getMinutes() === 0) {
          // Reset at midnight
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          
          try {
            // Reset session count for all users
            const { error: updateError } = await supabase
              .from('user_balances')
              .update({ 
                daily_session_count: 0,
                updated_at: new Date().toISOString()
              })
              .eq('id', session.user.id);
              
            if (updateError) {
              console.error("Error resetting session count:", updateError);
            }
            
            await incrementSessionCount(); // This will reset to 0 in our function
            
            // Also reset balance for freemium accounts
            if (userData.subscription === 'freemium') {
              const { error: balanceError } = await supabase
                .from('user_balances')
                .update({ 
                  balance: 0,
                  updated_at: new Date().toISOString()
                })
                .eq('id', session.user.id)
                .eq('subscription', 'freemium');
                
              if (balanceError) {
                console.error("Error resetting freemium balance:", balanceError);
              }
              
              await updateBalance(0, ''); // This will reset balance to 0
              setShowLimitAlert(false);
            }
          } catch (error) {
            console.error("Error in midnight reset:", error);
          }
        }
      } catch (error) {
        console.error("Error checking midnight reset:", error);
      }
    };
    
    // Check every minute for midnight reset
    const midnightInterval = setInterval(checkMidnightReset, 60000);
    
    return () => clearInterval(midnightInterval);
  }, [userData.subscription, incrementSessionCount, updateBalance, setShowLimitAlert]);

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

  const handleStartSession = async () => {
    // Prevent multiple concurrent sessions and rapid clicking
    if (isStartingSession || sessionInProgress.current || operationLock.current) {
      console.log("Session or operation already in progress, ignoring request");
      return;
    }
    
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
  
  const handleWithdrawal = async () => {
    // Prevent multiple concurrent operations
    if (isStartingSession || sessionInProgress.current || operationLock.current) return;
    
    try {
      operationLock.current = true;
      sessionInProgress.current = true;
      
      // Process withdrawal only if sufficient balance (at least 20€) and not freemium account
      if (userData.balance >= 20 && userData.subscription !== 'freemium') {
        // Reset balance to 0 to simulate withdrawal
        await resetBalance();
      } else if (userData.subscription === 'freemium') {
        toast({
          title: "Compte freemium",
          description: "Les retraits ne sont pas disponibles avec un compte freemium. Passez à un forfait supérieur.",
          variant: "destructive"
        });
      } else if (userData.balance < 20) {
        toast({
          title: "Solde insuffisant",
          description: "Vous devez avoir au moins 20€ pour effectuer un retrait.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du retrait. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      sessionInProgress.current = false;
      // Release operation lock after a delay
      setTimeout(() => {
        operationLock.current = false;
      }, 1000);
    }
  };

  return {
    isStartingSession,
    handleStartSession,
    handleWithdrawal
  };
};
