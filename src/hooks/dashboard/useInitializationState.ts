
import { useState, useCallback } from 'react';

/**
 * Hook to manage dashboard initialization state with memoized setters
 * to reduce unnecessary re-renders
 */
export const useInitializationState = () => {
  const [isAuthChecking, setIsAuthCheckingState] = useState(true);
  const [isReady, setIsReadyState] = useState(false);
  const [authError, setAuthErrorState] = useState(false);
  
  // Memoize state setter functions to prevent unnecessary re-renders
  const setIsAuthChecking = useCallback((value: boolean) => {
    setIsAuthCheckingState(value);
  }, []);
  
  const setIsReady = useCallback((value: boolean) => {
    setIsReadyState(value);
  }, []);
  
  const setAuthError = useCallback((value: boolean) => {
    setAuthErrorState(value);
  }, []);
  
  return {
    isAuthChecking,
    setIsAuthChecking,
    isReady,
    setIsReady,
    authError,
    setAuthError
  };
};
