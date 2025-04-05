
import { toast } from "@/components/ui/use-toast";

/**
 * Hook that provides retry logic for fetch operations
 */
export const useRetryLogic = (retryCount: React.MutableRefObject<number>) => {
  const maxRetries = 3;
  
  // Calculate delay for next retry with exponential backoff
  const calculateRetryDelay = () => {
    return Math.min(1000 * Math.pow(2, retryCount.current), 8000);
  };
  
  // Handle error with retry logic
  const handleFetchError = (
    error: any, 
    isMounted: React.MutableRefObject<boolean>,
    onRetry: () => void
  ) => {
    console.error("Error fetching user data:", error);
    
    if (retryCount.current < maxRetries && isMounted.current) {
      const delay = calculateRetryDelay();
      console.log(`Retrying in ${delay}ms (attempt ${retryCount.current + 1}/${maxRetries})`);
      
      setTimeout(() => {
        if (isMounted.current) {
          retryCount.current++;
          onRetry();
        }
      }, delay);
      return true; // Retry initiated
    } else if (isMounted.current) {
      toast({
        title: "Problème de connexion",
        description: "Impossible de charger vos données. Veuillez rafraîchir la page.",
        variant: "destructive"
      });
      return false; // No more retries
    }
    return false;
  };
  
  // Reset retry counter
  const resetRetryCount = () => {
    retryCount.current = 0;
  };
  
  return {
    handleFetchError,
    resetRetryCount,
    maxRetries
  };
};
