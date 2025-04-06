
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { verifyAuth, refreshSession } from "@/utils/auth/index";
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
  const authCheckCompleted = useRef(false);

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
    // Éviter les exécutions multiples
    if (checkInProgress.current || !isMounted.current) {
      console.log("Vérification d'authentification déjà en cours ou composant démonté");
      return;
    }
    
    // Nettoyer les drapeaux locaux de redirection
    localStorage.removeItem('auth_redirecting');
    localStorage.removeItem('auth_redirect_timestamp');
    
    checkInProgress.current = true;
    
    if (isManualRetry) {
      setIsRetrying(true);
      setAuthCheckFailed(false);
      setIsAuthenticated(null);
    }
    
    console.log("Vérification d'authentification démarrée");
    
    // Définir un timeout de sécurité plus court
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
    }, 5000); // 5 secondes max
    
    try {
      // Vérifier si une session est présente localement
      const hasLocalToken = !!localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      
      if (!hasLocalToken) {
        if (isMounted.current) {
          setIsAuthenticated(false);
          setAuthCheckFailed(false);
          authCheckCompleted.current = true;
        }
        
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
        }
        
        checkInProgress.current = false;
        return;
      }
      
      // Essayer de rafraîchir d'abord, puis récupérer
      await refreshSession();
      
      // Court délai pour laisser la session se propager
      await new Promise(resolve => setTimeout(resolve, 200));
      
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
        
        if (isMounted.current) {
          setAuthCheckFailed(true);
          setIsAuthenticated(false);
          setRetryAttempts(prev => prev + 1);
          authCheckCompleted.current = true;
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
          authCheckCompleted.current = true;
          fetchProfileData(data.session.user.id);
        }
      } else {
        if (isMounted.current) {
          setIsAuthenticated(false);
          setAuthCheckFailed(false);
          authCheckCompleted.current = true;
        }
      }
    } catch (err) {
      console.error("Erreur pendant la vérification d'authentification:", err);
      
      if (isMounted.current) {
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        authCheckCompleted.current = true;
      }
    } finally {
      setIsRetrying(false);
      
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      
      checkInProgress.current = false;
    }
  }, [fetchProfileData]);

  // Effet d'initialisation principal simplifié pour éviter les boucles
  useEffect(() => {
    // Nettoyer les flags au montage
    isMounted.current = true;
    checkInProgress.current = false;
    
    console.log("useAuthVerification hook monté");
    
    // Ne vérifier qu'une seule fois au montage
    if (!authCheckCompleted.current) {
      // Délai court pour éviter les conflits
      const initTimeout = setTimeout(() => {
        if (isMounted.current && !checkInProgress.current) {
          checkAuth();
        }
      }, 100);
      
      return () => clearTimeout(initTimeout);
    }
    
    return () => {
      console.log("useAuthVerification hook démonté");
      isMounted.current = false;
      
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
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
