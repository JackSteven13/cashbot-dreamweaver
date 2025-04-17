
import { useState, useCallback } from 'react';

/**
 * Hook to manage session analysis animations
 */
export const useSessionAnimations = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Start animation
  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    
    // Dispatch animation event for components that might need it
    window.dispatchEvent(new CustomEvent('session:animation-start', {
      detail: { timestamp: Date.now() }
    }));
  }, []);
  
  // Stop animation
  const stopAnimation = useCallback(() => {
    setIsAnimating(false);
    
    // Dispatch animation stop event
    window.dispatchEvent(new CustomEvent('session:animation-end', {
      detail: { timestamp: Date.now() }
    }));
  }, []);
  
  return {
    isAnimating,
    startAnimation,
    stopAnimation
  };
};

export default useSessionAnimations;
