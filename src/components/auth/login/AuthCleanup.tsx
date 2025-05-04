
import { useEffect } from 'react';
import { clearStoredAuthData } from '@/integrations/supabase/client';

const AuthCleanup = () => {
  // Nettoyer les données d'authentification au chargement
  useEffect(() => {
    const cleanup = () => {
      console.log("Nettoyage des données d'authentification via AuthCleanup");
      clearStoredAuthData();
      
      // Nettoyer également les anciens flags qui pourraient bloquer l'authentification
      localStorage.removeItem('auth_checking');
      localStorage.removeItem('auth_refreshing');
      localStorage.removeItem('auth_redirecting');
      localStorage.removeItem('auth_redirect_timestamp');
      localStorage.removeItem('auth_check_timestamp');
    };
    
    // Exécuter immédiatement
    cleanup();
    
    // Et re-exécuter après un court délai pour s'assurer que d'autres 
    // composants n'ont pas réintroduit des données d'authentification
    const timer = setTimeout(cleanup, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return null; // Composant sans rendu
};

export default AuthCleanup;
