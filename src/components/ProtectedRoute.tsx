
import { ReactNode, useEffect, useRef, useCallback, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthVerification } from '@/hooks/useAuthVerification';
import AuthLoadingScreen from './auth/AuthLoadingScreen';
import ProtectedRouteRecovery from './auth/ProtectedRouteRecovery';
import { toast } from '@/components/ui/use-toast';
import { forceSignOut } from '@/utils/auth/sessionUtils';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const redirectInProgress = useRef(false);
  const initialCheckComplete = useRef(false);
  const autoRetryCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxLoadingTime = useRef<NodeJS.Timeout | null>(null);
  const [forceReset, setForceReset] = useState(false);
  
  // État pour suivre les redirections et éviter les boucles infinies
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  
  // Use auth verification with retry capability
  const { 
    isAuthenticated, 
    authCheckFailed, 
    isRetrying, 
    checkAuth,
    retryAttempts
  } = useAuthVerification();

  // Force reset auth state when needed
  useEffect(() => {
    if (forceReset) {
      // Reset localStorage items that might be causing issues
      localStorage.removeItem('auth_checking');
      localStorage.removeItem('auth_refreshing');
      localStorage.removeItem('auth_redirecting');
      localStorage.removeItem('auth_redirect_timestamp');
      localStorage.removeItem('auth_check_timestamp');
      
      // Retry auth check with forced parameters
      checkAuth(true);
      setForceReset(false);
    }
  }, [forceReset, checkAuth]);

  // Fonction de nettoyage stable des timeouts
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (maxLoadingTime.current) {
      clearTimeout(maxLoadingTime.current);
      maxLoadingTime.current = null;
    }
  }, []);

  // Effet pour gérer le timeout maximum avec déblocage forcé
  useEffect(() => {
    if (isAuthenticated === null && !maxLoadingTime.current) {
      maxLoadingTime.current = setTimeout(() => {
        console.log("Maximum loading time reached, forcing verification");
        if (!redirectInProgress.current && isAuthenticated === null) {
          // Avant de réessayer, nettoyer tout état potentiellement bloquant
          localStorage.removeItem('auth_checking');
          localStorage.removeItem('auth_refreshing');
          localStorage.removeItem('auth_redirecting');
          localStorage.removeItem('auth_check_timestamp');
          
          // Forcer une réinitialisation complète
          setForceReset(true);
        }
      }, 12000); // Augmenté à 12 secondes pour permettre à l'auth de se terminer
    }
    
    return clearTimeouts;
  }, [isAuthenticated, clearTimeouts]);

  // Effect for auto-retry with cleanup
  useEffect(() => {
    // Clear any existing retry timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Auto retry logic with limits
    if (authCheckFailed && autoRetryCount.current < 2 && !timeoutRef.current && !redirectInProgress.current) {
      console.log(`Automatic retry ${autoRetryCount.current + 1}/2`);
      
      timeoutRef.current = setTimeout(() => {
        if (!redirectInProgress.current) {
          autoRetryCount.current += 1;
          
          // Nettoyer l'état avant de réessayer
          localStorage.removeItem('auth_checking');
          localStorage.removeItem('auth_refreshing');
          
          checkAuth(true);
        }
        timeoutRef.current = null;
      }, 2000); // Retenter après 2 secondes
    }
    
    // Mark initial check as complete when we have a definitive answer
    if (isAuthenticated !== null && !initialCheckComplete.current) {
      initialCheckComplete.current = true;
      console.log("Initial auth check completed, result:", isAuthenticated);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [authCheckFailed, isAuthenticated, checkAuth]);

  // Clean up on unmount to prevent memory leaks
  useEffect(() => {
    console.log("ProtectedRoute mounting");
    redirectInProgress.current = false;
    
    return () => {
      console.log("ProtectedRoute unmounting");
      clearTimeouts();
      
      // Clear all localStorage flags to prevent stale state
      localStorage.removeItem('auth_checking');
      localStorage.removeItem('auth_refreshing');
      localStorage.removeItem('auth_redirecting');
      localStorage.removeItem('auth_check_timestamp');
    };
  }, [clearTimeouts]);

  // Fonction pour rediriger vers la page de login de manière sécurisée
  const handleCleanLogin = useCallback(() => {
    if (redirectAttempts >= 3) {
      // Si trop de redirections, forcer une déconnexion complète
      forceSignOut().then(() => {
        window.location.href = '/login';
      });
      return;
    }
    
    if (!redirectInProgress.current) {
      redirectInProgress.current = true;
      setRedirectAttempts(prev => prev + 1);
      
      // Forcer la suppression de tous les tokens et flags
      try {
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
        localStorage.removeItem('auth_checking');
        localStorage.removeItem('auth_refreshing');
        localStorage.removeItem('auth_redirecting');
        localStorage.removeItem('auth_check_timestamp');
      } catch (e) {
        console.error("Erreur lors du nettoyage du localStorage:", e);
      }
      
      toast({
        title: "Problème d'authentification",
        description: "Veuillez vous reconnecter",
        variant: "destructive"
      });
      
      // Utiliser une redirection directe pour éviter les problèmes de React Router
      window.location.href = '/login';
    }
  }, [redirectAttempts]);

  // Afficher l'écran de récupération en cas d'échec après plusieurs tentatives
  if (authCheckFailed && (autoRetryCount.current >= 2 || retryAttempts >= 3)) {
    return (
      <ProtectedRouteRecovery
        isRetrying={isRetrying}
        autoRetryCount={autoRetryCount}
        maxAutoRetries={2}
        onRetry={() => checkAuth(true)}
        onCleanLogin={handleCleanLogin}
      />
    );
  }
  
  // Afficher l'écran de chargement pendant la vérification d'authentification
  if (isAuthenticated === null) {
    return <AuthLoadingScreen onManualRetry={() => {
      clearTimeouts();
      setForceReset(true);
    }} />;
  }

  // Rediriger vers login si non authentifié
  if (isAuthenticated === false) {
    if (!redirectInProgress.current) {
      redirectInProgress.current = true;
      
      // Nettoyer les flags de redirection
      localStorage.removeItem('auth_redirecting');
      localStorage.removeItem('auth_checking');
      localStorage.removeItem('auth_refreshing');
      localStorage.removeItem('auth_check_timestamp');
      
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si authentifié, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;
