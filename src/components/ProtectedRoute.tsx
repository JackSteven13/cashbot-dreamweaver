
import { ReactNode, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthVerification } from '@/hooks/useAuthVerification';
import AuthLoadingScreen from './auth/AuthLoadingScreen';
import ProtectedRouteRecovery from './auth/ProtectedRouteRecovery';

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
  
  // Get auth verification hooks - stables avec useRef pour les flags
  const { 
    isAuthenticated, 
    authCheckFailed, 
    isRetrying, 
    checkAuth
  } = useAuthVerification();

  // Configurer un timeout pour éviter les états de chargement infinis
  useEffect(() => {
    // Si l'authentification n'a pas encore été vérifiée, configurer un délai maximal
    if (isAuthenticated === null && !maxLoadingTime.current) {
      maxLoadingTime.current = setTimeout(() => {
        if (isAuthenticated === null) {
          console.log("Temps de chargement maximum atteint, forçage de la vérification");
          checkAuth(true);
        }
      }, 8000);
    }
    
    // Nettoyer le timeout lors du démontage
    return () => {
      if (maxLoadingTime.current) {
        clearTimeout(maxLoadingTime.current);
        maxLoadingTime.current = null;
      }
    };
  }, [isAuthenticated, checkAuth]);

  // Mettre à jour l'état local basé sur le statut d'authentification
  useEffect(() => {
    if (authCheckFailed && autoRetryCount.current < 3) {
      console.log(`Nouvel essai automatique ${autoRetryCount.current + 1}/3`);
      
      // Attendre avant de réessayer
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        autoRetryCount.current += 1;
        checkAuth(true);
      }, 2000);
    }
    
    if (isAuthenticated !== null && !initialCheckComplete.current) {
      initialCheckComplete.current = true;
      console.log("Vérification d'authentification initiale terminée, résultat:", isAuthenticated);
    }
  }, [authCheckFailed, isAuthenticated, checkAuth]);

  // Nettoyer lors du démontage
  useEffect(() => {
    return () => {
      console.log("ProtectedRoute démontage");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxLoadingTime.current) {
        clearTimeout(maxLoadingTime.current);
      }
    };
  }, []);

  // Afficher l'écran de récupération si la vérification d'authentification a échoué
  if (authCheckFailed) {
    return (
      <ProtectedRouteRecovery
        isRetrying={isRetrying}
        autoRetryCount={autoRetryCount}
        maxAutoRetries={3}
        onRetry={() => checkAuth(true)}
        onCleanLogin={() => {
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
          window.location.href = '/login';
        }}
      />
    );
  }
  
  // Afficher l'écran de chargement pendant la vérification d'authentification
  if (isAuthenticated === null) {
    return <AuthLoadingScreen />;
  }

  // Rediriger vers la page de connexion si non authentifié
  if (isAuthenticated === false) {
    if (!redirectInProgress.current) {
      redirectInProgress.current = true;
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si authentifié, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;
