
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

/**
 * Composant pour nettoyer efficacement les données d'authentification
 */
const AuthCleanup = () => {
  const isMounted = useRef(true);
  const supabase = createClient();
  
  // Nettoyer les données d'authentification
  useEffect(() => {
    console.log("🧹 AuthCleanup: Nettoyage en cours");
    
    const clearAuthData = () => {
      if (!isMounted.current) return;
      
      try {
        // Supprimer les tokens
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-auth-token');
        localStorage.removeItem('supabase.auth.token');
        
        // Supprimer les cookies associés
        const cookiesToRemove = ['sb-access-token', 'sb-refresh-token'];
        cookiesToRemove.forEach(name => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });
      } catch (e) {
        console.error("Erreur lors du nettoyage:", e);
      }
    };
    
    // Effectuer la déconnexion puis nettoyer
    const performCleanup = async () => {
      try {
        // Tentative de déconnexion
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.error("Erreur de déconnexion:", e);
      }
      
      // Nettoyage des données
      clearAuthData();
      
      // Second nettoyage après un délai
      setTimeout(clearAuthData, 300);
    };
    
    performCleanup();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  return null; // Composant sans rendu
};

export default AuthCleanup;
