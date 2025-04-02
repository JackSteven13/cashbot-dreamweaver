
import { useRef } from 'react';

/**
 * Hook to manage dashboard initialization refs
 */
export const useInitializationRefs = () => {
  const mountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckInProgress = useRef(false);
  const authCheckAttempted = useRef(false);
  
  return {
    mountedRef,
    initTimeoutRef,
    authCheckInProgress,
    authCheckAttempted
  };
};
