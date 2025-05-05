
import { useEffect } from 'react';
import { clearStoredAuthData } from '@/integrations/supabase/client';

const AuthCleanup = () => {
  // Nettoyer les données d'authentification immédiatement
  useEffect(() => {
    console.log("Nettoyage radical des données d'authentification via AuthCleanup");
    
    // Exécuter immédiatement
    clearStoredAuthData();
    
    // Et réexécuter après 500ms pour s'assurer que tout est propre
    const timer = setTimeout(clearStoredAuthData, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return null; // Composant sans rendu
};

export default AuthCleanup;
