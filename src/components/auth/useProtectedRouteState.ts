
import { useRef, useState } from 'react';

/**
 * Hook to manage protected route state
 */
export const useProtectedRouteState = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const redirectInProgress = useRef(false);
  const initialCheckComplete = useRef(false);
  const autoRetryCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxLoadingTime = useRef<NodeJS.Timeout | null>(null);

  return {
    isAuthenticated,
    setIsAuthenticated,
    redirectInProgress,
    initialCheckComplete,
    autoRetryCount,
    timeoutRef,
    maxLoadingTime
  };
};
