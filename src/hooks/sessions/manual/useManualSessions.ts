
import { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { getEffectiveSubscription, SUBSCRIPTION_LIMITS } from '@/utils/subscription/subscriptionStatus';
import { useSessionProtection } from './useSessionProtection';
import { useLimitChecking } from './useLimitChecking';
import { useSessionGain } from './useSessionGain';
import { UseManualSessionsProps, UseManualSessionsReturn } from './types';
import { startBalanceAnimation, stopBalanceAnimation, animateBalance } from './useBalanceAnimation';
import { dispatchSessionStart, dispatchBalanceUpdate, dispatchForceBalanceUpdate } from './useSessionEvents';
import { checkDailyLimit, updateLimitAlertStatus } from './useSessionValidation';

export const useManualSessions = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance,
  setShowLimitAlert
}: UseManualSessionsProps): UseManualSessionsReturn => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [localBalance, setLocalBalance] = useState(userData.balance);
  
  // Maintain local reference to current balance to avoid race conditions
  const currentBalanceRef = useRef<number>(userData.balance);
  
  // Update reference when userData changes
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
  
  const { checkSessionLimit, getTodaysGains } = useLimitChecking();
  const { calculateSessionGain } = useSessionGain();

  const handleStartSession = async () => {
    // Vérifier si le bot est actif
    const isBotActive = localStorage.getItem(`botActive_${userData.profile?.id}`) === 'true';
    
    // Si le bot est en pause et qu'on essaie de démarrer une session manuelle, afficher un avertissement
    if (!isBotActive) {
      toast({
        title: "Assistant d'analyse en pause",
        description: "Activez l'assistant d'analyse avant de lancer une session.",
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    
    // Check if we can start a new session
    if (!canStartNewSession()) {
      return;
    }
    
    // Check boost limit to prevent abuse
    if (checkBoostLimit()) {
      return;
    }
    
    // Get today's gains
    const todaysGains = getTodaysGains(userData);
    
    // Check if daily limit is already reached
    if (!checkDailyLimit(userData, todaysGains, setShowLimitAlert)) {
      return;
    }
    
    // Save current balance to avoid visual resets
    const startingBalance = currentBalanceRef.current;
    
    // Check session limit based on subscription
    if (!checkSessionLimit(userData, dailySessionCount, todaysGains, setShowLimitAlert)) {
      return;
    }
    
    // Set click debounce to prevent rapid clicks
    setClickDebounce();
    
    // Trigger session start event for UI animations
    dispatchSessionStart();
    
    try {
      // Set all locks and flags
      setLocks();
      setIsStartingSession(true);
      
      // Increment daily session count for freemium accounts
      if (userData.subscription === 'freemium') {
        await incrementSessionCount();
      }
      
      // Start visual animations
      startBalanceAnimation();
      
      // Calculate gain for the session - don't reset the balance
      const { success, finalGain, newBalance } = await calculateSessionGain(
        userData,
        startingBalance,
        setShowLimitAlert
      );
      
      if (success && finalGain > 0) {
        console.log("Session successful, updating UI balance from", startingBalance, "to", newBalance);
        
        // Animate balance transition for smoother experience
        await animateBalance(startingBalance, newBalance, setLocalBalance);
        
        // Update local reference before API call
        currentBalanceRef.current = newBalance;
        
        // Dispatch balance update event for UI animations
        dispatchBalanceUpdate(finalGain, userData.profile?.id);
        
        // NEW APPROACH: Force complete balance update for visual consistency
        dispatchForceBalanceUpdate(newBalance, finalGain, userData.profile?.id);
        
        // Add small delay to allow animations to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update user balance in database with UI force update flag
        await updateBalance(
          finalGain,
          `Session manuelle : Notre technologie a optimisé le processus et généré ${finalGain.toFixed(2)}€ de revenus pour votre compte ${userData.subscription}.`,
          true // UI force update flag
        );
        
        // Update boost counter for rate limiting
        updateBoostCount();
        
        // Check if limit is now reached
        const effectiveSub = getEffectiveSubscription(userData.subscription);
        const effectiveLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS];
        updateLimitAlertStatus(todaysGains, finalGain, effectiveSub, effectiveLimit, setShowLimitAlert);
      }
    } catch (error) {
      console.error("Error during session:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue pendant la session. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      // Ensure smooth transition from loading state
      // Add slight delay to allow animations to complete
      setTimeout(() => {
        setIsStartingSession(false);
        clearLocks();
        
        // Remove visual effects after animation
        stopBalanceAnimation();
      }, 1500);
    }
  };

  return {
    isStartingSession,
    handleStartSession,
    localBalance // Export local balance for direct UI updates
  };
};

export default useManualSessions;
