
import { useState } from 'react';

interface UseAuthStateResult {
  isAuthenticated: boolean | null;
  authCheckFailed: boolean;
  isRetrying: boolean;
  retryAttempts: number;
  setIsAuthenticated: (value: boolean | null) => void;
  setAuthCheckFailed: (value: boolean) => void;
  setIsRetrying: (value: boolean) => void;
  setRetryAttempts: (value: number) => void;
  incrementRetryAttempts: () => void;
}

export const useAuthState = (): UseAuthStateResult => {
  // State for authentication status
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authCheckFailed, setAuthCheckFailed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  
  const incrementRetryAttempts = () => {
    setRetryAttempts(prev => prev + 1);
  };

  return {
    isAuthenticated,
    authCheckFailed,
    isRetrying,
    retryAttempts,
    setIsAuthenticated,
    setAuthCheckFailed,
    setIsRetrying,
    setRetryAttempts,
    incrementRetryAttempts
  };
};

export default useAuthState;
