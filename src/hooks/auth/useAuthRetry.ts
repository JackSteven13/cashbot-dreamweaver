
import { useState, useCallback } from 'react';

interface UseAuthRetryProps {
  maxRetries?: number;
  retryDelay?: number;
}

export const useAuthRetry = ({ maxRetries = 3, retryDelay = 2000 }: UseAuthRetryProps = {}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const retry = useCallback(async (operation: () => Promise<any>, errorMessage: string) => {
    if (retryCount >= maxRetries) {
      // Aucun toast visible à l'utilisateur
      console.warn(`Après plusieurs tentatives: ${errorMessage}`);
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
      
      // Pas de notification à l'utilisateur, juste logging
      console.warn(`Tentative de reconnexion... (${retryCount + 1}/${maxRetries})`);
      
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
