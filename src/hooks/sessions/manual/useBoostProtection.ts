
import { useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook to manage boost limits and prevent abuse
 */
export const useBoostProtection = () => {
  // Boost protection state
  const boostCountRef = useRef<number>(0);
  const lastBoostTimeRef = useRef<number>(Date.now());
  
  // Reset boost counter every 5 minutes
  useEffect(() => {
    const resetInterval = setInterval(() => {
      boostCountRef.current = 0;
    }, 5 * 60 * 1000);
    
    return () => clearInterval(resetInterval);
  }, []);
  
  /**
   * Check if user has exceeded boost limits
   * @returns true if limit exceeded, false otherwise
   */
  const checkBoostLimit = () => {
    const now = Date.now();
    if (now - lastBoostTimeRef.current < 30000 && boostCountRef.current >= 5) {
      toast({
        title: "Action limitée",
        description: "Vous effectuez trop de boosts en peu de temps. Veuillez patienter quelques minutes.",
        variant: "destructive"
      });
      return true;
    }
    return false;
  };
  
  /**
   * Update boost count after successful boost operation
   */
  const updateBoostCount = () => {
    boostCountRef.current += 1;
    lastBoostTimeRef.current = Date.now();
  };
  
  return {
    boostCountRef,
    lastBoostTimeRef,
    checkBoostLimit,
    updateBoostCount
  };
};
