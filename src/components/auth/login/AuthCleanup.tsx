
import { useEffect } from 'react';
import { clearStoredAuthData } from '@/integrations/supabase/client';

const AuthCleanup = () => {
  // Nettoyer les données d'authentification au chargement de la page de connexion
  useEffect(() => {
    // Nettoyer les tokens potentiellement invalides
    clearStoredAuthData();
    
    // Nettoyer les flags d'état qui pourraient bloquer les fonctionnalités
    localStorage.removeItem('auth_checking');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('auth_redirecting');
  }, []);

  return null;
};

export default AuthCleanup;
