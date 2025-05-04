
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface UseAuthCheckerProps {
  isMounted: React.RefObject<boolean>;
  fetchProfileData: (userId: string) => Promise<void>;
  setIsAuthenticated: (value: boolean | null) => void;
  setAuthCheckFailed: (value: boolean) => void;
  setIsRetrying: (value: boolean) => void;
  incrementRetryAttempts: () => void;
}

export const useAuthChecker = ({
  isMounted,
  fetchProfileData,
  setIsAuthenticated,
  setAuthCheckFailed,
  setIsRetrying,
  incrementRetryAttempts
}: UseAuthCheckerProps) => {
  
  // Version simplifiée de la vérification d'authentification
  const checkAuth = useCallback(async (isManualRetry = false) => {
    if (!isMounted.current) return;
    
    if (isManualRetry) {
      setIsRetrying(true);
      incrementRetryAttempts();
    }
    
    try {
      // Vérifier simplement l'existence d'une session
      const { data, error } = await supabase.auth.getSession();
      
      if (!isMounted.current) return;
      
      if (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        setAuthCheckFailed(true);
        setIsRetrying(false);
        return;
      }
      
      if (data.session) {
        setIsAuthenticated(true);
        setAuthCheckFailed(false);
        
        // Récupérer les données du profil si nécessaire
        try {
          await fetchProfileData(data.session.user.id);
        } catch (err) {
          console.error("Failed to fetch profile data:", err);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      if (!isMounted.current) return;
      
      console.error("Error during auth check:", err);
      setAuthCheckFailed(true);
      setIsAuthenticated(false);
    } finally {
      if (isMounted.current) {
        setIsRetrying(false);
      }
    }
  }, [
    isMounted,
    fetchProfileData,
    setIsAuthenticated,
    setAuthCheckFailed,
    setIsRetrying,
    incrementRetryAttempts
  ]);

  return { checkAuth };
};

export default useAuthChecker;
