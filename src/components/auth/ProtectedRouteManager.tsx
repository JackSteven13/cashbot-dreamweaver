
import { ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthVerification } from '@/hooks/useAuthVerification';
import AuthLoadingScreen from './AuthLoadingScreen';
import ProtectedRouteRecovery from './ProtectedRouteRecovery';
import { toast } from '@/components/ui/use-toast';
import { forceSignOut } from '@/utils/auth/sessionUtils';
import { useProtectedRouteState } from './useProtectedRouteState';
import { useAuthRedirect } from './useAuthRedirect';
import { useAuthTimeouts } from './useAuthTimeouts';

interface ProtectedRouteManagerProps {
  children: ReactNode;
}

/**
 * Main component that handles the authentication verification flow
 */
const ProtectedRouteManager = ({ children }: ProtectedRouteManagerProps) => {
  const {
    isAuthenticated, 
    setIsAuthenticated,
    redirectInProgress,
    initialCheckComplete,
    autoRetryCount,
    timeoutRef,
    maxLoadingTime
  } = useProtectedRouteState();
  
  const [forceReset, setForceReset] = useState(false);
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  
  const { 
    isAuthenticated: authStatus, 
    authCheckFailed, 
    isRetrying, 
    checkAuth,
    retryAttempts
  } = useAuthVerification();

  const { handleCleanLogin, location } = useAuthRedirect();

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

  // Update isAuthenticated state from useAuthVerification
  useEffect(() => {
    setIsAuthenticated(authStatus);
  }, [authStatus, setIsAuthenticated]);

  // Set up timeouts for protection against stalled auth checks
  useAuthTimeouts({
    timeoutRef,
    maxLoadingTime,
    initialCheckComplete,
    isAuthenticated,
    redirectInProgress,
    handleCleanLogin,
    checkAuth
  });

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
  }, [authCheckFailed, isAuthenticated, checkAuth, timeoutRef, redirectInProgress]);

  // Clean up on unmount to prevent memory leaks
  useEffect(() => {
    console.log("ProtectedRoute mounting");
    redirectInProgress.current = false;
    
    return () => {
      console.log("ProtectedRoute unmounting");
      
      // Clear all localStorage flags to prevent stale state
      localStorage.removeItem('auth_checking');
      localStorage.removeItem('auth_refreshing');
      localStorage.removeItem('auth_redirecting');
      localStorage.removeItem('auth_check_timestamp');
    };
  }, [redirectInProgress]);

  // Fonction pour rediriger vers la page de login de manière sécurisée
  const handleCleanLoginSafely = useCallback(() => {
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
  }, [redirectAttempts, redirectInProgress]);

  // Afficher l'écran de récupération en cas d'échec après plusieurs tentatives
  if (authCheckFailed && (autoRetryCount.current >= 2 || retryAttempts >= 3)) {
    return (
      <ProtectedRouteRecovery
        isRetrying={isRetrying}
        autoRetryCount={autoRetryCount.current}
        maxAutoRetries={2}
        onRetry={() => checkAuth(true)}
        onCleanLogin={handleCleanLoginSafely}
      />
    );
  }
  
  // Afficher l'écran de chargement pendant la vérification d'authentification
  if (isAuthenticated === null) {
    return <AuthLoadingScreen onManualRetry={() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (maxLoadingTime.current) {
        clearTimeout(maxLoadingTime.current);
        maxLoadingTime.current = null;
      }
      
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

export default ProtectedRouteManager;
