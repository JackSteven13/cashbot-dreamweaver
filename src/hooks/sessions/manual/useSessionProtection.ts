
import { useBoostProtection } from './useBoostProtection';
import { useClickDebounce } from './useClickDebounce';
import { useSessionLocks } from './useSessionLocks';

/**
 * Combined hook that provides all session protection mechanisms
 * Uses separate hooks for better organization but maintains the same API
 */
export const useSessionProtection = () => {
  // Use the individual protection hooks
  const { 
    boostCountRef, 
    lastBoostTimeRef, 
    checkBoostLimit, 
    updateBoostCount 
  } = useBoostProtection();
  
  const { 
    clickTimeoutRef, 
    setClickDebounce, 
    isDebounceActive 
  } = useClickDebounce();
  
  const { 
    sessionInProgress, 
    operationLock, 
    clearLocks, 
    setLocks, 
    areLocksActive 
  } = useSessionLocks();
  
  /**
   * Comprehensive check if a new session can be started
   * Considers both debounce and locks
   */
  const canStartNewSession = () => {
    // Check for debounce first
    if (isDebounceActive()) {
      console.log("Ignoring rapid click, debouncing active");
      return false;
    }
    
    // Then check for active locks
    if (areLocksActive()) {
      console.log("Session or operation already in progress, ignoring request");
      return false;
    }
    
    return true;
  };
  
  // Return the same API as before to maintain compatibility
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
