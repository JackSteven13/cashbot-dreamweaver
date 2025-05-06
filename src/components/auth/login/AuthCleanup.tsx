
import { useEffect } from 'react';
import { clearStoredAuthData, supabase } from '@/integrations/supabase/client';

/**
 * Composant invisible qui nettoie agressivement les données d'authentification
 * au chargement de la page de connexion
 */
const AuthCleanup = () => {
  useEffect(() => {
    const cleanupAuth = async () => {
      console.log("Exécution du nettoyage d'authentification au chargement de la page de connexion");
      
      try {
        // Premier nettoyage
        clearStoredAuthData();
        
        // Déconnexion explicite avec scope global
        await supabase.auth.signOut({ scope: 'global' });
        
        // Attendre que la déconnexion soit traitée
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Deuxième nettoyage pour garantir un état propre
        clearStoredAuthData();
        
        // Vérifier qu'aucune session n'est présente
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.warn("Session toujours présente après nettoyage, forçage supplémentaire");
          
          // Tentative finale de déconnexion
          await supabase.auth.signOut();
          clearStoredAuthData();
          
          // Effacer les cookies de domaine si nous sommes en production
          if (window.location.hostname.includes('streamgenius.io')) {
            document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=streamgenius.io;';
            document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=streamgenius.io;';
          }
        }
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
