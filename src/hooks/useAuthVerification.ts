
import { useState, useCallback, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { refreshSession, verifyAuth } from "@/utils/authUtils";
import { toast } from "@/components/ui/use-toast";

interface UseAuthVerificationResult {
  isAuthenticated: boolean | null;
  username: string | null;
  authCheckFailed: boolean;
  isRetrying: boolean;
  retryAttempts: number;
  checkAuth: (isManualRetry?: boolean) => Promise<void>;
}

export const useAuthVerification = (): UseAuthVerificationResult => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authCheckFailed, setAuthCheckFailed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const maxRetries = 3;

  const checkAuth = useCallback(async (isManualRetry = false) => {
    if (isManualRetry) {
      setIsRetrying(true);
      setAuthCheckFailed(false);
      setIsAuthenticated(null);
    }
    
    try {
      console.log(`Vérification d'authentification ${isManualRetry ? "manuelle" : "automatique"} (tentative ${retryAttempts + 1})`);
      
      // Try refreshing the session first for better stability
      if (retryAttempts > 0) {
        console.log("Trying to refresh session before auth check");
        await refreshSession();
      }
      
      const isAuthValid = await verifyAuth();
      
      if (!isAuthValid) {
        console.log("Échec d'authentification");
        
        if (retryAttempts < maxRetries && !isManualRetry) {
          // Auto-retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(1.5, retryAttempts), 5000);
          console.log(`Nouvelle tentative automatique dans ${delay}ms`);
          
          setRetryAttempts(prev => prev + 1);
          setTimeout(() => checkAuth(), delay);
          return;
        }
        
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        setIsRetrying(false);
        return;
      }
      
      // Get user data
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      
      if (!user) {
        throw new Error("Aucun utilisateur trouvé malgré une session valide");
      }
      
      console.log("Utilisateur authentifié:", user.id);
      setRetryAttempts(0); // Reset retry counter on success
      
      // Get profile for welcome message
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
          
        const displayName = profileData?.full_name || 
                          user.user_metadata?.full_name || 
                          (user.email ? user.email.split('@')[0] : 'utilisateur');
        
        setUsername(displayName);
        setIsAuthenticated(true);
        setIsRetrying(false);
      } catch (profileError) {
        console.error("Erreur lors de la récupération du profil:", profileError);
        // Continue even if profile fails
        setIsAuthenticated(true);
        setIsRetrying(false);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification d'authentification:", error);
      
      if (retryAttempts < maxRetries && !isManualRetry) {
        // Auto-retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(1.5, retryAttempts), 5000);
        console.log(`Nouvelle tentative après erreur dans ${delay}ms`);
        
        setRetryAttempts(prev => prev + 1);
        setTimeout(() => checkAuth(), delay);
        return;
      }
      
      setAuthCheckFailed(true);
      setIsAuthenticated(false);
      setIsRetrying(false);
    }
  }, [retryAttempts]);

  useEffect(() => {
    let isMounted = true;
    
    // Set timeout for initial auth check with longer delay
    const initTimeout = setTimeout(() => {
      if (isMounted) {
        setRetryAttempts(0); // Reset retry attempts on new mount
        checkAuth();
      }
    }, 800);
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      console.log(`Changement d'état d'authentification:`, event);
      
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUsername(null);
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        const user = session.user;
        if (user) {
          setUsername(user.user_metadata?.full_name || user.email?.split('@')[0] || 'utilisateur');
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, [checkAuth]);

  return {
    isAuthenticated,
    username,
    authCheckFailed,
    isRetrying,
    retryAttempts,
    checkAuth
  };
};
