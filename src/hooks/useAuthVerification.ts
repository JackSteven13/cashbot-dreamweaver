
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { refreshSession, verifyAuth } from "@/utils/auth/index";
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
  const isMounted = useRef(true);
  const authCheckInProgress = useRef(false);

  const checkAuth = useCallback(async (isManualRetry = false) => {
    // Éviter les vérifications simultanées
    if (authCheckInProgress.current) {
      console.log("Auth check already in progress, skipping");
      return;
    }
    
    try {
      authCheckInProgress.current = true;
      
      if (isManualRetry) {
        setIsRetrying(true);
        setAuthCheckFailed(false);
        setIsAuthenticated(null);
      }
      
      console.log(`Vérification d'authentification ${isManualRetry ? "manuelle" : "automatique"} (tentative ${retryAttempts + 1})`);
      
      // Try refreshing the session first for better stability
      if (retryAttempts > 0) {
        console.log("Trying to refresh session before auth check");
        await refreshSession();
        
        // Petit délai pour permettre au rafraîchissement de se propager
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const isAuthValid = await verifyAuth();
      
      if (!isMounted.current) {
        authCheckInProgress.current = false;
        return;
      }
      
      if (!isAuthValid) {
        console.log("Échec d'authentification");
        
        if (retryAttempts < maxRetries && !isManualRetry) {
          // Auto-retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(1.5, retryAttempts), 5000);
          console.log(`Nouvelle tentative automatique dans ${delay}ms`);
          
          setRetryAttempts(prev => prev + 1);
          authCheckInProgress.current = false;
          
          setTimeout(() => {
            if (isMounted.current) {
              checkAuth();
            }
          }, delay);
          return;
        }
        
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        setIsRetrying(false);
        authCheckInProgress.current = false;
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
        
        if (isMounted.current) {
          setUsername(displayName);
          setIsAuthenticated(true);
          setIsRetrying(false);
        }
      } catch (profileError) {
        console.error("Erreur lors de la récupération du profil:", profileError);
        // Continue even if profile fails
        if (isMounted.current) {
          setIsAuthenticated(true);
          setIsRetrying(false);
        }
      }
      
      authCheckInProgress.current = false;
    } catch (error) {
      console.error("Erreur lors de la vérification d'authentification:", error);
      
      if (retryAttempts < maxRetries && !isManualRetry && isMounted.current) {
        // Auto-retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(1.5, retryAttempts), 5000);
        console.log(`Nouvelle tentative après erreur dans ${delay}ms`);
        
        setRetryAttempts(prev => prev + 1);
        authCheckInProgress.current = false;
        
        setTimeout(() => {
          if (isMounted.current) {
            checkAuth();
          }
        }, delay);
        return;
      }
      
      if (isMounted.current) {
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        setIsRetrying(false);
      }
      
      authCheckInProgress.current = false;
    }
  }, [retryAttempts]);

  useEffect(() => {
    isMounted.current = true;
    authCheckInProgress.current = false;
    
    // Set timeout for initial auth check with longer delay
    const initTimeout = setTimeout(() => {
      if (isMounted.current) {
        setRetryAttempts(0); // Reset retry attempts on new mount
        checkAuth();
      }
    }, 800);
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted.current) return;
      
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
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log("Token refreshed successfully");
        setIsAuthenticated(true);
      }
    });

    return () => {
      console.log("useAuthVerification hook unmounting");
      isMounted.current = false;
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
