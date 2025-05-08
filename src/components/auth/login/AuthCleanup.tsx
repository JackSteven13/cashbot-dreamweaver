
import { useEffect } from 'react';
import { clearStoredAuthData, supabase } from '@/integrations/supabase/client';

const AuthCleanup = () => {
  useEffect(() => {
    console.log("🧹 AuthCleanup: Nettoyage radical en cours");
    
    // Fonction de nettoyage complète
    const performCleanup = async () => {
      try {
        // 1. Nettoyer localement d'abord
        clearStoredAuthData();
        
        // 2. Déconnexion explicite
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.error("Erreur lors de la déconnexion explicite:", e);
        }
        
        // 3. Nettoyage supplémentaire
        try {
          // Effacer les cookies liés à l'authentification
          document.cookie.split(';').forEach(c => {
            if (c.trim().startsWith('sb-')) {
              document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
            }
          });
        } catch (e) {
          console.error("Erreur lors du nettoyage des cookies:", e);
        }
        
        // 4. Vérifier l'URL pour les paramètres d'authentification
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
    
    // Exécuter également après un court délai pour s'assurer que tout est bien nettoyé
    const secondCleanupTimer = setTimeout(() => {
      performCleanup();
    }, 500);
    
    return () => {
      clearTimeout(secondCleanupTimer);
    };
  }, []);

  return null; // Composant sans rendu
};

export default AuthCleanup;
