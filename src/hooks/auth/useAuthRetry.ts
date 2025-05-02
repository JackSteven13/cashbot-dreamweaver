
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseAuthRetryProps {
  maxRetries?: number;
  retryDelay?: number;
}

export const useAuthRetry = ({ maxRetries = 3, retryDelay = 2000 }: UseAuthRetryProps = {}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const retry = useCallback(async (operation: () => Promise<any>, errorMessage: string) => {
    if (retryCount >= maxRetries) {
      toast.error(`Après plusieurs tentatives: ${errorMessage}`, {
        duration: 5000,
        action: {
          label: "Solutions",
          onClick: () => {
            toast.info("Essayez de vider votre cache DNS ou utiliser un autre réseau.", {
              duration: 8000
            });
          }
        }
      });
      return null;
    }
    
    setIsRetrying(true);
    
    try {
      // Petite pause avant de réessayer
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      const result = await operation();
      setIsRetrying(false);
      return result;
    } catch (error) {
      console.error("Retry failed:", error);
      setRetryCount(prev => prev + 1);
      setIsRetrying(false);
      
      // Notification à l'utilisateur
      if (retryCount + 1 >= maxRetries) {
        toast.error(`Problème de connexion persistant. ${errorMessage}`, {
          duration: 6000
        });
      } else {
        toast.warning(`Tentative de reconnexion... (${retryCount + 1}/${maxRetries})`, { 
          duration: 2000 
        });
      }
      
      return null;
    }
  }, [retryCount, maxRetries, retryDelay]);
  
  const resetRetryCount = useCallback(() => {
    setRetryCount(0);
  }, []);
  
  return {
    retry,
    retryCount,
    isRetrying,
    resetRetryCount
  };
};

export default useAuthRetry;
