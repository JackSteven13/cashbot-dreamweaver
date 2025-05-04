
import { useEffect } from 'react';
import { clearStoredAuthData } from '@/integrations/supabase/client';

const AuthCleanup = () => {
  // Nettoyer les données d'authentification au chargement de la page de connexion
  useEffect(() => {
    // Nettoyer complètement les tokens
    clearStoredAuthData();
    
    console.log("Nettoyage des données d'authentification effectué");
  }, []);

  return null;
};

export default AuthCleanup;
