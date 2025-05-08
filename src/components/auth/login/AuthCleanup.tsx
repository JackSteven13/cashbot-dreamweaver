
import { useEffect } from 'react';
import { clearStoredAuthData, supabase } from '@/integrations/supabase/client';

const AuthCleanup = () => {
  // Nettoyer les données d'authentification de façon agressive
  useEffect(() => {
    console.log("🧹 AuthCleanup: Nettoyage radical en cours");
    
    // Fonction de nettoyage approfondi
    const performCleanup = async () => {
      try {
        // 1. Déconnexion globale explicite
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.error("Erreur lors de la déconnexion:", e);
        }
        
        // 2. Nettoyage radical du stockage local après un court délai
        setTimeout(() => {
          clearStoredAuthData();
        }, 100);
        
        // 3. Effacer également les cookies de session Supabase si possible
        document.cookie.split(";").forEach((c) => {
          const cookieName = c.trim().split("=")[0];
          if (cookieName.includes("sb-") || cookieName.includes("supabase")) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
        
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
    
    // Exécuter immédiatement puis réexécuter périodiquement
    performCleanup();
    
    // Réexécuter périodiquement pour garantir un état propre
    const cleanupInterval = setInterval(performCleanup, 10000);
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  return null; // Composant sans rendu
};

export default AuthCleanup;
