
import { ReactNode, useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { forceSignOut } from "@/utils/auth/sessionUtils";
import { useAuthVerification } from '@/hooks/useAuthVerification';
import AuthRecoveryScreen from './auth/AuthRecoveryScreen';
import AuthLoadingScreen from './auth/AuthLoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    authCheckFailed, 
    isRetrying, 
    checkAuth
  } = useAuthVerification();

  // Handle clean login function
  const handleCleanLogin = useCallback(() => {
    Promise.resolve(forceSignOut())
      .then(() => {
        console.log("Redirection vers la page de connexion");
        navigate('/login', { replace: true });
      })
      .catch((error) => {
        console.error("Erreur pendant la déconnexion propre:", error);
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  // Show recovery screen if auth check failed
  if (authCheckFailed) {
    return (
      <AuthRecoveryScreen 
        isRetrying={isRetrying}
        onRetry={() => checkAuth(true)}
        onCleanLogin={handleCleanLogin}
      />
    );
  }
  
  // Show loading screen while checking auth
  if (isAuthenticated === null) {
    return <AuthLoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (isAuthenticated === false) {
    toast({
      title: "Accès refusé",
      description: "Vous devez être connecté pour accéder à cette page.",
      variant: "destructive"
    });
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If authenticated, show protected content
  return <>{children}</>;
};

export default ProtectedRoute;
