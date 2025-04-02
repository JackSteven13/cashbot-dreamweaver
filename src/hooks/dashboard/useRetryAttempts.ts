
import { useRef, useCallback } from 'react';

/**
 * Hook to manage dashboard initialization retry attempts
 */
export const useRetryAttempts = (maxRetries: number = 3) => {
  const initializationRetries = useRef(0);
  
  const resetRetryCount = useCallback(() => {
    initializationRetries.current = 0;
  }, []);
  
  const incrementRetryCount = useCallback(() => {
    initializationRetries.current += 1;
    return initializationRetries.current;
  }, []);
  
  const shouldRetry = useCallback(() => {
    return initializationRetries.current < maxRetries;
  }, [maxRetries]);
  
  const calculateRetryDelay = useCallback((retryCount: number) => {
    return Math.min(1000 * Math.pow(2, retryCount), 8000);
  }, []);
  
  return {
    retryCount: initializationRetries,
    incrementRetryCount,
    resetRetryCount,
    shouldRetry,
    calculateRetryDelay
  };
};
