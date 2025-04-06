
import { ReactNode, useEffect, useRef, useCallback, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthVerification } from '@/hooks/useAuthVerification';
import AuthLoadingScreen from './auth/AuthLoadingScreen';
import ProtectedRouteRecovery from './auth/ProtectedRouteRecovery';
import { toast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const redirectInProgress = useRef(false);
  const initialCheckComplete = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxLoadingTime = useRef<NodeJS.Timeout | null>(null);
  const autoRetryCount = useRef(0);
  const stableLocationRef = useRef(location.pathname);
  
  // État pour forcer une réinitialisation en cas d'erreur persistante
  const [forceReset, setForceReset] = useState(false);
  
  // Mettre à jour la référence stable pour éviter les renders en cascade
  useEffect(() => {
    stableLocationRef.current = location.pathname;
  }, [location.pathname]);
  
  // Use auth verification with reset capability
  const { 
    isAuthenticated, 
    authCheckFailed, 
    isRetrying, 
    checkAuth
  } = useAuthVerification();

  // Force reset auth state when needed
  useEffect(() => {
    if (forceReset) {
      // Reset localStorage items that might be causing issues
      localStorage.removeItem('auth_checking');
      localStorage.removeItem('auth_refreshing');
      localStorage.removeItem('auth_redirecting');
      localStorage.removeItem('auth_redirect_timestamp');
      
      // Retry auth check with forced parameters
      checkAuth(true);
      setForceReset(false);
    }
  }, [forceReset, checkAuth]);

  // Stable cleanup function with no dependencies
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
          
          // Forcer une réinitialisation complète
          setForceReset(true);
        }
      }, 6000); // Réduit à 6 seconds pour débloquer plus rapidement
    }
    
    return clearTimeouts;
  }, [isAuthenticated, clearTimeouts]);

  // Effect for auto-retry with cleanup
  useEffect(() => {
    // Clear any existing retry timeout first to prevent multiple timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
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
      }, 1500);
    }
    
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
    };
  }, [clearTimeouts]);

  // Fonction pour rediriger vers la page de login de manière sécurisée
  const handleCleanLogin = useCallback(() => {
    if (!redirectInProgress.current) {
      redirectInProgress.current = true;
      
      // Forcer la suppression de tous les tokens et flags
      try {
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
        localStorage.removeItem('auth_checking');
        localStorage.removeItem('auth_refreshing');
        localStorage.removeItem('auth_redirecting');
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
  }, []);

  // Afficher l'écran de récupération en cas d'échec après plusieurs tentatives
  if (authCheckFailed && autoRetryCount.current >= 2) {
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
    return <AuthLoadingScreen />;
  }

  // Rediriger vers login si non authentifié
  if (isAuthenticated === false) {
    if (!redirectInProgress.current) {
      redirectInProgress.current = true;
      
      // Nettoyer les flags de redirection
      localStorage.removeItem('auth_redirecting');
      localStorage.removeItem('auth_checking');
      localStorage.removeItem('auth_refreshing');
      
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si authentifié, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;
