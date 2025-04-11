
import { useRef } from 'react';

/**
 * Hook to manage session locks to prevent concurrent operations
 */
export const useSessionLocks = () => {
  // Session state references
  const sessionInProgress = useRef(false);
  const operationLock = useRef(false);
  
  /**
   * Clear session locks with optional delay
   * @param delayMs Delay for operation lock clearing in milliseconds
   */
  const clearLocks = (delayMs: number = 1000) => {
    sessionInProgress.current = false;
    setTimeout(() => {
      operationLock.current = false;
    }, delayMs);
  };
  
  /**
   * Set all session locks
   */
  const setLocks = () => {
    operationLock.current = true;
    sessionInProgress.current = true;
  };
  
  /**
   * Check if locks are active and prevent new session
   * @returns true if a new session can be started, false otherwise
   */
  const areLocksActive = (): boolean => {
    return sessionInProgress.current || operationLock.current;
  };
  
  return {
    sessionInProgress,
    operationLock,
    clearLocks,
    setLocks,
    areLocksActive
  };
};
