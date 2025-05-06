
import { useEffect, useRef } from 'react';
import { createClient, clearAuthData } from '@/lib/supabase';

/**
 * Composant pour nettoyer efficacement les données d'authentification
 */
const AuthCleanup = () => {
  const isMounted = useRef(true);
  const cleanupComplete = useRef(false);
  const supabase = createClient();
  
  // Nettoyer les données d'authentification de façon agressive
  useEffect(() => {
    if (cleanupComplete.current) return;
    
    console.log("🧹 AuthCleanup: Nettoyage en cours");
    
    const performCleanup = async () => {
      if (!isMounted.current) return;
      
      try {
        // Déconnexion explicite d'abord
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.log("Erreur de déconnexion ignorée");
        }
        
        // Premier nettoyage
        clearAuthData();
        
        // Attendre un peu
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Second nettoyage pour s'assurer que tout est propre
        if (isMounted.current) {
          clearAuthData();
          cleanupComplete.current = true;
        }
      } catch (e) {
        console.error("Erreur lors du nettoyage:", e);
      }
    };
    
    performCleanup();
    
    // Nettoyage supplémentaire au démontage du composant
    return () => {
      isMounted.current = false;
    };
  }, []);

  return null; // Composant sans rendu
};

export default AuthCleanup;
