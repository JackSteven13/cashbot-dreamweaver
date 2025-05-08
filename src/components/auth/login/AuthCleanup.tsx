
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
        
        // 2. Déconnexion explicite avec gestion d'erreur robuste
        try {
          // Utiliser un timeout pour éviter les blocages
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          await supabase.auth.signOut();
          clearTimeout(timeoutId);
        } catch (e) {
          console.error("Erreur lors de la déconnexion explicite:", e);
          // Continuer malgré l'erreur - le nettoyage local est plus important
        }
        
        // 3. Nettoyage supplémentaire des cookies
        try {
          // Effacer les cookies liés à l'authentification
          document.cookie.split(';').forEach(c => {
            if (c.trim().startsWith('sb-') || c.trim().startsWith('supabase-')) {
              document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
            }
          });
        } catch (e) {
          console.error("Erreur lors du nettoyage des cookies:", e);
        }
        
        // 4. Vérifier et nettoyer l'URL si nécessaire
        if (window.location.hash && 
           (window.location.hash.includes("access_token") || 
            window.location.hash.includes("error") ||
            window.location.hash.includes("type=recovery"))) {
          // Nettoyer l'URL de tout paramètre d'authentification
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch (err) {
        console.error("Erreur lors du nettoyage complet:", err);
      }
    };
    
    // Exécuter immédiatement
    performCleanup();
    
    // Exécuter également après un court délai pour assurer un nettoyage complet
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
