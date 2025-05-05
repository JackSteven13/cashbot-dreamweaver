
import { useEffect, useRef } from 'react';
import { clearStoredAuthData, supabase } from '@/integrations/supabase/client';

const AuthCleanup = () => {
  // Utiliser une ref pour suivre si le composant est monté
  const isMounted = useRef(true);
  
  // Nettoyer les données d'authentification de manière agressive
  useEffect(() => {
    console.log("🧹 AuthCleanup: Nettoyage radical en cours");
    
    // Fonction de nettoyage complète
    const performFullCleanup = async () => {
      if (!isMounted.current) return;
      
      try {
        // 1. Déconnexion explicite
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.error("Erreur lors de la déconnexion:", e);
        }
        
        // 2. Nettoyage radical du stockage
        clearStoredAuthData();
      } catch (err) {
        console.error("Erreur lors du nettoyage complet:", err);
      }
    };
    
    // Exécuter immédiatement
    performFullCleanup();
    
    // Puis à nouveau après un délai pour s'assurer que tout est propre
    const timer1 = setTimeout(performFullCleanup, 500);
    const timer2 = setTimeout(clearStoredAuthData, 1500);
    
    return () => {
      isMounted.current = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return null; // Composant sans rendu
};

export default AuthCleanup;
