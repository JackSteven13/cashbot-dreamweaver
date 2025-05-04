
import { useEffect } from 'react';
import { clearStoredAuthData } from '@/integrations/supabase/client';

const AuthCleanup = () => {
  // Nettoyer les données d'authentification au chargement de la page de connexion
  useEffect(() => {
    // Nettoyer complètement les tokens
    clearStoredAuthData();
    
    // Nettoyer également les anciens flags qui pourraient bloquer l'authentification
    localStorage.removeItem('auth_checking');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('auth_redirecting');
    localStorage.removeItem('auth_redirect_timestamp');
    localStorage.removeItem('auth_check_timestamp');
    
    console.log("Nettoyage des données d'authentification effectué");
  }, []);

  return null;
};

export default AuthCleanup;
