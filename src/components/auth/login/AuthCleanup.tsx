
import { useEffect } from 'react';
import { clearStoredAuthData } from '@/integrations/supabase/client';

const AuthCleanup = () => {
  // Nettoyer les données d'authentification au chargement et périodiquement
  useEffect(() => {
    const cleanup = () => {
      console.log("Nettoyage radical des données d'authentification via AuthCleanup");
      clearStoredAuthData();
    };
    
    // Exécuter immédiatement
    cleanup();
    
    // Et re-exécuter périodiquement pour s'assurer qu'aucune donnée résiduelle n'existe
    const timer = setInterval(cleanup, 3000);
    
    return () => clearInterval(timer);
  }, []);

  return null; // Composant sans rendu
};

export default AuthCleanup;
