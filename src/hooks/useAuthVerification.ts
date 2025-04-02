
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
// Utiliser les importations spécifiques pour éviter les conflits
import { verifyAuth, refreshSession } from "@/utils/auth/index";

interface UseAuthVerificationResult {
  isAuthenticated: boolean | null;
  username: string | null;
  authCheckFailed: boolean;
  isRetrying: boolean;
  retryAttempts: number;
  checkAuth: (isManualRetry?: boolean) => Promise<void>;
}

export const useAuthVerification = (): UseAuthVerificationResult => {
  // État initial stabilisé
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authCheckFailed, setAuthCheckFailed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  
  // Références pour la stabilité
  const isMounted = useRef(true);
  const checkInProgress = useRef(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAuthRedirecting = useRef(false);

  // Fonction pour récupérer les données de profil
  const fetchProfileData = useCallback(async (userId: string) => {
    if (!isMounted.current) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Erreur lors de la récupération du profil:", error);
        return;
      }
      
      if (data && isMounted.current) {
        setUsername(data.full_name || 'Utilisateur');
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
    }
  }, []);

  // Fonction stabilisée pour vérifier l'authentification
  const checkAuth = useCallback(async (isManualRetry = false) => {
    // Vérifier si une redirection est déjà en cours via localStorage
    const authRedirecting = localStorage.getItem('auth_redirecting') === 'true';
    
    if (authRedirecting || isAuthRedirecting.current) {
      console.log("Redirection auth déjà en cours, vérification ignorée");
      return;
    }
    
    if (checkInProgress.current || !isMounted.current) {
      console.log("Vérification d'authentification déjà en cours ou composant démonté, ignorée");
      return;
    }
    
    checkInProgress.current = true;
    
    if (isManualRetry) {
      setIsRetrying(true);
      setAuthCheckFailed(false);
      setIsAuthenticated(null);
    }
    
    console.log("Vérification d'authentification démarrée");
    
    // Définir un timeout de sécurité
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
    }
    
    authTimeoutRef.current = setTimeout(() => {
      if (checkInProgress.current && isMounted.current) {
        console.log("Timeout de vérification atteint, échec forcé");
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        checkInProgress.current = false;
      }
    }, 10000); // 10 secondes max
    
    try {
      // Vérifier si une session est présente localement
      const hasLocalToken = !!localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      
      if (!hasLocalToken) {
        if (isMounted.current) {
          setIsAuthenticated(false);
          setAuthCheckFailed(false);
        }
        
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
        }
        
        checkInProgress.current = false;
        return;
      }
      
      // Récupérer la session active
      const { data, error } = await supabase.auth.getSession();
      
      if (!isMounted.current) {
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
        }
        
        checkInProgress.current = false;
        return;
      }
      
      if (error || !data.session) {
        console.error("Erreur ou pas de session:", error);
        
        // Essayer de rafraîchir la session une fois
        if (retryAttempts < 1) {
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (!isMounted.current) {
              if (authTimeoutRef.current) {
                clearTimeout(authTimeoutRef.current);
              }
              
              checkInProgress.current = false;
              return;
            }
            
            if (refreshError || !refreshData.session) {
              console.error("Échec du rafraîchissement:", refreshError);
              
              if (isMounted.current) {
                setAuthCheckFailed(true);
                setIsAuthenticated(false);
                setRetryAttempts(prev => prev + 1);
              }
              
              if (authTimeoutRef.current) {
                clearTimeout(authTimeoutRef.current);
              }
              
              checkInProgress.current = false;
              return;
            }
            
            // Session rafraîchie avec succès
            if (isMounted.current) {
              setIsAuthenticated(true);
              setAuthCheckFailed(false);
              fetchProfileData(refreshData.session.user.id);
            }
          } catch (refreshErr) {
            console.error("Erreur de rafraîchissement:", refreshErr);
            
            if (isMounted.current) {
              setAuthCheckFailed(true);
              setIsAuthenticated(false);
              setRetryAttempts(prev => prev + 1);
            }
          }
        } else {
          // Trop de tentatives de rafraîchissement
          if (isMounted.current) {
            setAuthCheckFailed(true);
            setIsAuthenticated(false);
          }
        }
        
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
        }
        
        checkInProgress.current = false;
        return;
      }
      
      // Session valide trouvée
      if (data.session && data.session.user) {
        if (isMounted.current) {
          setIsAuthenticated(true);
          setAuthCheckFailed(false);
          fetchProfileData(data.session.user.id);
        }
      } else {
        if (isMounted.current) {
          setIsAuthenticated(false);
          setAuthCheckFailed(false);
        }
      }
    } catch (err) {
      console.error("Erreur pendant la vérification d'authentification:", err);
      
      if (isMounted.current) {
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
      }
    } finally {
      setIsRetrying(false);
      
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      
      checkInProgress.current = false;
    }
  }, [retryAttempts, fetchProfileData]);

  // Effet pour gérer les flags de redirection
  useEffect(() => {
    // Vérifier au montage si une redirection est déjà en cours
    const authRedirecting = localStorage.getItem('auth_redirecting') === 'true';
    isAuthRedirecting.current = authRedirecting;
    
    // Observer les changements sur le localStorage pour auth_redirecting
    const checkRedirectingFlag = () => {
      const isRedirecting = localStorage.getItem('auth_redirecting') === 'true';
      isAuthRedirecting.current = isRedirecting;
    };
    
    // Check every second
    const intervalId = setInterval(checkRedirectingFlag, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Effet pour écouter les changements d'état d'authentification
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted.current) return;
      
      console.log("Changement d'état d'authentification:", event);
      
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUsername(null);
      } else if (event === 'TOKEN_REFRESHED') {
        setIsAuthenticated(true);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Effet d'initialisation principal
  useEffect(() => {
    // Nettoyer les flags au montage
    isMounted.current = true;
    checkInProgress.current = false;
    
    console.log("useAuthVerification hook monté");
    
    // Vérifier si une redirection est déjà en cours
    const authRedirecting = localStorage.getItem('auth_redirecting') === 'true';
    
    if (authRedirecting) {
      console.log("Redirection auth déjà en cours, initialisation ignorée");
      return;
    }
    
    // Délai court pour éviter les conflits
    const initTimeout = setTimeout(() => {
      if (isMounted.current && !checkInProgress.current && !isAuthRedirecting.current) {
        checkAuth();
      }
    }, 300);
    
    return () => {
      console.log("useAuthVerification hook démonté");
      isMounted.current = false;
      
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
      
      clearTimeout(initTimeout);
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

export default useAuthVerification;
