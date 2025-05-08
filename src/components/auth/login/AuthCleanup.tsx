
import { useEffect } from 'react';
import { clearStoredAuthData, supabase } from '@/integrations/supabase/client';

const AuthCleanup = () => {
  useEffect(() => {
    console.log("🧹 AuthCleanup: Nettoyage en cours");
    
    // Fonction de nettoyage complète
    const performCleanup = async () => {
      try {
        // 1. Nettoyer localement d'abord
        clearStoredAuthData();
        
        // 2. Déconnexion explicite
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.error("Erreur lors de la déconnexion:", e);
        }
        
        // 3. Nettoyage des cookies liés à l'authentification
        try {
          document.cookie.split(';').forEach(c => {
            if (c.trim().startsWith('sb-') || c.trim().startsWith('supabase-')) {
              document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
            }
          });
        } catch (e) {
          console.error("Erreur lors du nettoyage des cookies:", e);
        }
        
        // 4. Nettoyer l'URL si nécessaire
        if (window.location.hash && 
           (window.location.hash.includes("access_token") || 
            window.location.hash.includes("error"))) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch (err) {
        console.error("Erreur lors du nettoyage:", err);
      }
    };
    
    // Exécuter immédiatement
    performCleanup();
    
  }, []);

  return null;
};

export default AuthCleanup;
