
import { useRef } from 'react';

interface UseRetryLogicParams {
  maxRetries: number;
}

export const useRetryLogic = ({ maxRetries = 3 }: UseRetryLogicParams) => {
  const retryAttemptsRef = useRef(0);
  
  const calculateRetryDelay = (retryCount: number): number => {
    // Exponential backoff with a maximum delay
    return Math.min(1000 * Math.pow(2, retryCount), 8000);
  };
  
  const shouldRetry = (): boolean => {
    return retryAttemptsRef.current < maxRetries;
  };
  
  const incrementRetryCount = (): number => {
    retryAttemptsRef.current += 1;
    return retryAttemptsRef.current;
  };
  
  const resetRetryCount = (): void => {
    retryAttemptsRef.current = 0;
  };
  
  return {
    retryCount: retryAttemptsRef.current,
    shouldRetry,
    incrementRetryCount,
    calculateRetryDelay,
    resetRetryCount
  };
};
