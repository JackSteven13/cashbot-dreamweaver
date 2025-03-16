
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { 
  SUBSCRIPTION_LIMITS, 
  checkDailyLimit, 
  canStartManualSession,
  calculateManualSessionGain,
  calculateAutoSessionGain
} from '@/utils/subscriptionUtils';
import { UserData } from './useUserData';
import { supabase } from "@/integrations/supabase/client";

export const useDashboardSessions = (
  userData: UserData,
  dailySessionCount: number,
  incrementSessionCount: () => void,
  updateBalance: (gain: number, report: string) => void,
  setShowLimitAlert: (show: boolean) => void,
  resetBalance: () => void
) => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [lastAutoSessionTime, setLastAutoSessionTime] = useState(Date.now());

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
          
          incrementSessionCount(); // This will reset to 0 in our function
          
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
            
            updateBalance(0, ''); // This will reset balance to 0
            setShowLimitAlert(false);
          }
        } catch (error) {
          console.error("Error in midnight reset:", error);
        }
      }
    };
    
    // Check every minute for midnight reset
    const midnightInterval = setInterval(checkMidnightReset, 60000);
    
    return () => clearInterval(midnightInterval);
  }, [userData.subscription]);

  const generateAutomaticRevenue = () => {
    // Calculate gain using the new utility function
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
    updateBalance(
      randomGain,
      `Le système a généré ${randomGain}€ de revenus grâce à notre technologie propriétaire. Votre abonnement ${userData.subscription} vous permet d'accéder à ce niveau de performance.`
    );

    toast({
      title: "Revenus générés",
      description: `CashBot a généré ${randomGain}€ pour vous !`,
    });
  };

  const handleStartSession = () => {
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
    
    setIsStartingSession(true);
    
    // Increment daily session count for freemium accounts
    if (userData.subscription === 'freemium') {
      incrementSessionCount();
    }
    
    // Simulate manual session
    setTimeout(() => {
      setIsStartingSession(false);
      
      // Calculate gain using the new utility function
      const randomGain = calculateManualSessionGain(
        userData.subscription, 
        userData.balance, 
        userData.referrals.length
      );
      
      // Update user data
      updateBalance(
        randomGain,
        `Session manuelle : Notre technologie a optimisé le processus et généré ${randomGain}€ de revenus pour votre compte ${userData.subscription}.`
      );
      
      toast({
        title: "Session terminée",
        description: `CashBot a généré ${randomGain}€ de revenus pour vous !`,
      });
    }, 2000);
  };
  
  const handleWithdrawal = () => {
    // Process withdrawal only if sufficient balance (at least 20€) and not freemium account
    if (userData.balance >= 20 && userData.subscription !== 'freemium') {
      // Reset balance to 0 to simulate withdrawal
      resetBalance();
    }
  };

  return {
    isStartingSession,
    handleStartSession,
    handleWithdrawal
  };
};
