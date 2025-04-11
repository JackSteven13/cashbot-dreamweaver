
import { useRef, useEffect } from 'react';

/**
 * Hook to manage click debouncing and prevent rapid clicks
 */
export const useClickDebounce = () => {
  const clickTimeoutRef = useRef<number | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);
  
  /**
   * Set click debounce to prevent rapid clicks
   * @param durationMs Debounce duration in milliseconds
   */
  const setClickDebounce = (durationMs: number = 2000) => {
    clickTimeoutRef.current = window.setTimeout(() => {
      clickTimeoutRef.current = null;
    }, durationMs);
  };
  
  /**
   * Check if debounce is active (user cannot click yet)
   * @returns true if debounce is active
   */
  const isDebounceActive = (): boolean => {
    return clickTimeoutRef.current !== null;
  };
  
  return {
    clickTimeoutRef,
    setClickDebounce,
    isDebounceActive
  };
};
