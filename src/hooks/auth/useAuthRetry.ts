
import { useState, useCallback, useRef } from 'react';
import { refreshSession, verifyAuth } from "@/utils/auth/index";

interface UseAuthRetryOptions {
  maxRetries?: number;
  isMounted: React.RefObject<boolean>;
}

interface UseAuthRetryResult {
  retryAttempts: number;
  isRetrying: boolean;
  setIsRetrying: (value: boolean) => void;
  performAuthCheck: (isManualRetry?: boolean) => Promise<boolean>;
}

/**
 * Hook pour gérer la logique de nouvelle tentative d'authentification avec meilleure stabilité
 */
export const useAuthRetry = ({ 
  maxRetries = 3,
  isMounted
}: UseAuthRetryOptions): UseAuthRetryResult => {
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const authCheckInProgress = useRef(false);
  const authCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const performAuthCheck = useCallback(async (isManualRetry = false): Promise<boolean> => {
    // Éviter les vérifications simultanées
    if (authCheckInProgress.current) {
      console.log("Vérification d'authentification déjà en cours, ignorée");
      return false;
    }
    
    // Mettre en place un timeout pour éviter les blocages
    if (authCheckTimeoutRef.current) {
      clearTimeout(authCheckTimeoutRef.current);
    }
    
    authCheckTimeoutRef.current = setTimeout(() => {
      if (authCheckInProgress.current && isMounted.current) {
        console.log("Timeout de vérification atteint, réinitialisation");
        authCheckInProgress.current = false;
      }
    }, 15000);
    
    try {
      authCheckInProgress.current = true;
      
      if (isManualRetry) {
        setIsRetrying(true);
      }
      
      console.log(`Vérification d'authentification ${isManualRetry ? "manuelle" : "automatique"} (tentative ${retryAttempts + 1})`);
      
      // Tenter de rafraîchir la session pour plus de persistance
      if (retryAttempts > 0) {
        console.log("Rafraîchissement de session avant vérification");
        await refreshSession();
        
        // Petit délai pour permettre au rafraîchissement de se propager
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Vérification avec persistance améliorée
      const isAuthValid = await verifyAuth();
      
      if (!isMounted.current) {
        if (authCheckTimeoutRef.current) clearTimeout(authCheckTimeoutRef.current);
        authCheckInProgress.current = false;
        return false;
      }
      
      if (!isAuthValid) {
        console.log("Échec d'authentification");
        
        if (retryAttempts < maxRetries && !isManualRetry) {
          // Auto-retry avec backoff exponentiel
          const delay = Math.min(1000 * Math.pow(1.5, retryAttempts), 5000);
          console.log(`Nouvelle tentative automatique dans ${delay}ms`);
          
          setRetryAttempts(prev => prev + 1);
          
          if (authCheckTimeoutRef.current) clearTimeout(authCheckTimeoutRef.current);
          authCheckInProgress.current = false;
          
          setTimeout(() => {
            if (isMounted.current) {
              performAuthCheck();
            }
          }, delay);
          return false;
        }
        
        setIsRetrying(false);
        if (authCheckTimeoutRef.current) clearTimeout(authCheckTimeoutRef.current);
        authCheckInProgress.current = false;
        return false;
      }
      
      // Vérification réussie
      setRetryAttempts(0); // Réinitialiser le compteur
      setIsRetrying(false);
      
      if (authCheckTimeoutRef.current) clearTimeout(authCheckTimeoutRef.current);
      authCheckInProgress.current = false;
      return true;
      
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      
      if (retryAttempts < maxRetries && !isManualRetry && isMounted.current) {
        // Auto-retry avec backoff exponentiel
        const delay = Math.min(1000 * Math.pow(1.5, retryAttempts), 5000);
        console.log(`Nouvelle tentative après erreur dans ${delay}ms`);
        
        setRetryAttempts(prev => prev + 1);
        
        if (authCheckTimeoutRef.current) clearTimeout(authCheckTimeoutRef.current);
        authCheckInProgress.current = false;
        
        setTimeout(() => {
          if (isMounted.current) {
            performAuthCheck();
          }
        }, delay);
        return false;
      }
      
      if (isMounted.current) {
        setIsRetrying(false);
      }
      
      if (authCheckTimeoutRef.current) clearTimeout(authCheckTimeoutRef.current);
      authCheckInProgress.current = false;
      return false;
    }
  }, [retryAttempts, maxRetries, isMounted]);

  return {
    retryAttempts,
    isRetrying,
    setIsRetrying,
    performAuthCheck
  };
};

export default useAuthRetry;
