
import { useEffect } from 'react';
import { clearStoredAuthData, supabase } from '@/integrations/supabase/client';

const AuthCleanup = () => {
  useEffect(() => {
    console.log("🧹 AuthCleanup: Nettoyage radical en cours");
    
    // Fonction de nettoyage simplifiée
    const performCleanup = async () => {
      try {
        // 1. Déconnexion explicite
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.error("Erreur lors de la déconnexion:", e);
        }
        
        // 2. Nettoyage radical du stockage
        clearStoredAuthData();
        
        // 3. Vérifier l'URL pour les paramètres d'authentification
        if (window.location.hash && 
           (window.location.hash.includes("access_token") || 
            window.location.hash.includes("error"))) {
          // Nettoyer l'URL de tout paramètre d'authentification
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch (err) {
        console.error("Erreur lors du nettoyage complet:", err);
      }
    };
    
    // Exécuter immédiatement
    performCleanup();
  }, []);

  return null; // Composant sans rendu
};

export default AuthCleanup;
