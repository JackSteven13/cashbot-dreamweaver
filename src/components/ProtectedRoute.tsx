
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('user_registered') === 'true' && localStorage.getItem('username');

  useEffect(() => {
    // Vérifier l'authentification à chaque changement de route
    if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/register') {
      console.log('Utilisateur non authentifié, redirection vers la page de connexion');
    }
  }, [location.pathname, isAuthenticated]);

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si l'utilisateur est authentifié, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;
