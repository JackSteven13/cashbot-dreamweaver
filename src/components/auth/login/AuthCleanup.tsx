
import { useEffect } from 'react';
import { clearStoredAuthData, supabase } from '@/integrations/supabase/client';

/**
 * Composant invisible qui nettoie agressivement les données d'authentification
 */
const AuthCleanup = () => {
  useEffect(() => {
    const cleanupAuth = async () => {
      console.log("Exécution du nettoyage d'authentification");
      
      try {
        // Premier nettoyage
        clearStoredAuthData();
        
        // Déconnexion explicite
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.log("Erreur de déconnexion ignorée");
        }
        
        // Second nettoyage après un délai
        setTimeout(() => {
          clearStoredAuthData();
        }, 300);
      } catch (error) {
        console.error("Erreur pendant le nettoyage d'authentification:", error);
      }
    };
    
    // Lancer le nettoyage
    cleanupAuth();
  }, []);
  
  // Ce composant ne rend rien
  return null;
};

export default AuthCleanup;
