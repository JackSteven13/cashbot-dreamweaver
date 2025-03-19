
import { useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

export const useSessionProtection = () => {
  // Session state references
  const sessionInProgress = useRef(false);
  const operationLock = useRef(false);
  const clickTimeoutRef = useRef<number | null>(null);
  const boostCountRef = useRef<number>(0);
  const lastBoostTimeRef = useRef<number>(Date.now());
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Réinitialiser le compteur de boosts toutes les 5 minutes
  useEffect(() => {
    const resetInterval = setInterval(() => {
      boostCountRef.current = 0;
    }, 5 * 60 * 1000);
    
    return () => clearInterval(resetInterval);
  }, []);
  
  const checkBoostLimit = () => {
    const now = Date.now();
    if (now - lastBoostTimeRef.current < 30000 && boostCountRef.current >= 5) {
      toast({
        title: "Action limitée",
        description: "Vous effectuez trop de boosts en peu de temps. Veuillez patienter quelques minutes.",
        variant: "destructive"
      });
      return true;
    }
    return false;
  };
  
  const updateBoostCount = () => {
    boostCountRef.current += 1;
    lastBoostTimeRef.current = Date.now();
  };
  
  const setClickDebounce = (durationMs: number = 2000) => {
    clickTimeoutRef.current = window.setTimeout(() => {
      clickTimeoutRef.current = null;
    }, durationMs);
  };
  
  const clearLocks = (delayMs: number = 1000) => {
    sessionInProgress.current = false;
    setTimeout(() => {
      operationLock.current = false;
    }, delayMs);
  };
  
  const setLocks = () => {
    operationLock.current = true;
    sessionInProgress.current = true;
  };
  
  const canStartNewSession = () => {
    // Debounce rapid clicks - ignore if clicked within last 2 seconds
    if (clickTimeoutRef.current !== null) {
      console.log("Ignoring rapid click, debouncing active");
      return false;
    }
    
    // Prevent multiple concurrent sessions and rapid clicking
    if (sessionInProgress.current || operationLock.current) {
      console.log("Session or operation already in progress, ignoring request");
      return false;
    }
    
    return true;
  };
  
  return {
    sessionInProgress,
    operationLock,
    clickTimeoutRef,
    boostCountRef,
    lastBoostTimeRef,
    checkBoostLimit,
    updateBoostCount,
    setClickDebounce,
    clearLocks,
    setLocks,
    canStartNewSession
  };
};
