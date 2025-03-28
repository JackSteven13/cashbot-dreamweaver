
import { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { getEffectiveSubscription, SUBSCRIPTION_LIMITS } from '@/utils/subscriptionUtils';
import { useSessionProtection } from './useSessionProtection';
import { useLimitChecking } from './useLimitChecking';
import { useSessionGain } from './useSessionGain';
import { UseManualSessionsProps, UseManualSessionsReturn } from './types';

export const useManualSessions = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance,
  setShowLimitAlert
}: UseManualSessionsProps): UseManualSessionsReturn => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [localBalance, setLocalBalance] = useState(userData.balance);
  
  // Maintain a local reference to the current balance to avoid race conditions
  const currentBalanceRef = useRef<number>(userData.balance);
  
  // Update the balance reference when userData changes
  useEffect(() => {
    if (currentBalanceRef.current !== userData.balance) {
      console.log("Updating balance reference from", currentBalanceRef.current, "to", userData.balance);
      currentBalanceRef.current = userData.balance;
      setLocalBalance(userData.balance);
    }
  }, [userData.balance]);
  
  // Hooks for session management
  const { 
    checkBoostLimit, 
    updateBoostCount, 
    setClickDebounce, 
    clearLocks, 
    setLocks, 
    canStartNewSession 
  } = useSessionProtection();
  
  const { checkSessionLimit } = useLimitChecking();
  const { calculateSessionGain } = useSessionGain();

  const handleStartSession = async () => {
    // Check if we can start a new session
    if (!canStartNewSession()) {
      return;
    }
    
    // Check for boost limit to prevent abuse
    if (checkBoostLimit()) {
      return;
    }
    
    // Check session limit based on subscription
    if (!checkSessionLimit(userData, dailySessionCount, currentBalanceRef.current, setShowLimitAlert)) {
      return;
    }
    
    // Set debounce to prevent rapid clicking
    setClickDebounce();
    
    try {
      // Set all locks and flags
      setLocks();
      setIsStartingSession(true);
      
      // Increment daily session count for freemium accounts
      if (userData.subscription === 'freemium') {
        await incrementSessionCount();
      }
      
      // Calculate gain for the session
      const { success, finalGain, newBalance } = await calculateSessionGain(
        userData,
        currentBalanceRef.current,
        setShowLimitAlert
      );
      
      if (success && finalGain > 0) {
        console.log("Session successful, updating UI balance from", currentBalanceRef.current, "to", newBalance);
        
        // Update local state immediately to reflect change in UI
        setLocalBalance(newBalance);
        
        // Update local reference before API call
        currentBalanceRef.current = newBalance;
        
        // Update user balance in database with forceful UI update flag
        await updateBalance(
          finalGain,
          `Session manuelle : Notre technologie a optimisé le processus et généré ${finalGain.toFixed(2)}€ de revenus pour votre compte ${userData.subscription}.`,
          true // Force UI update flag
        );
        
        // Update boost count for rate limiting
        updateBoostCount();
        
        // Check if limit is now reached
        const effectiveSub = getEffectiveSubscription(userData.subscription);
        const effectiveLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS];
        
        if (newBalance >= effectiveLimit) {
          setShowLimitAlert(true);
        }
      }
    } catch (error) {
      console.error("Error during session:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue pendant la session. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      setIsStartingSession(false);
      clearLocks();
    }
  };

  return {
    isStartingSession,
    handleStartSession,
    localBalance // Export local balance for direct UI updates
  };
};

export default useManualSessions;
