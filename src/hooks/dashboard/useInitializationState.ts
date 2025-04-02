
import { useState } from 'react';

/**
 * Hook to manage dashboard initialization state
 */
export const useInitializationState = () => {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  return {
    isAuthChecking,
    setIsAuthChecking,
    isReady,
    setIsReady,
    authError,
    setAuthError
  };
};
