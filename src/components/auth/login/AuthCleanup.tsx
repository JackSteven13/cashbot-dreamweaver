
import { useEffect } from 'react';
import { clearStoredAuthData, supabase, testSupabaseConnection } from '@/integrations/supabase/client';

const AuthCleanup = () => {
  // Nettoyer les données d'authentification de façon agressive
  useEffect(() => {
    console.log("🧹 AuthCleanup: Nettoyage radical en cours");
    
    // Fonction de nettoyage approfondi
    const performCleanup = async () => {
      try {
        // 1. Vérifier la connectivité avec Supabase
        const isConnected = await testSupabaseConnection();
        
        if (!isConnected) {
          console.warn("Impossible de se connecter à Supabase, les données seront nettoyées localement uniquement");
          clearStoredAuthData();
          return;
        }
        
        // 2. Déconnexion globale explicite
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.error("Erreur lors de la déconnexion:", e);
        }
        
        // 3. Nettoyage radical du stockage local après un court délai
        setTimeout(() => {
          clearStoredAuthData();
        }, 200);
        
        // 4. Vérifier l'URL pour les paramètres d'authentification
        if (window.location.hash && 
           (window.location.hash.includes("access_token") || 
            window.location.hash.includes("error"))) {
          // Nettoyer l'URL de tout paramètre d'authentification
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch (err) {
        console.error("Erreur lors du nettoyage complet:", err);
        // En cas d'erreur, forcer le nettoyage local
        clearStoredAuthData();
      }
    };
    
    // Exécuter immédiatement
    performCleanup();
    
    return () => {
      // Nettoyage final avant démontage
      console.log("AuthCleanup: Nettoyage final avant démontage");
    };
  }, []);

  return null; // Composant sans rendu
};

export default AuthCleanup;
