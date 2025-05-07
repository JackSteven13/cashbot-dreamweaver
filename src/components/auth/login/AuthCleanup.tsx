
import { useEffect, useRef } from 'react';
import { clearStoredAuthData, supabase } from '@/lib/supabase';

const AuthCleanup = () => {
  // Utiliser une ref pour suivre si le composant est monté
  const isMounted = useRef(true);
  
  // Nettoyer les données d'authentification de manière très agressive
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
        
        // 3. Nettoyage supplémentaire des clés spécifiques
        try {
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
          sessionStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
          
          // 4. Supprimer explicitement tous les cookies liés à l'authentification
          document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          
          // 5. Vider complètement le sessionStorage
          sessionStorage.clear();
        } catch (err) {
          console.error("Erreur lors du nettoyage spécifique:", err);
        }
      } catch (err) {
        console.error("Erreur lors du nettoyage complet:", err);
      }
    };
    
    // Exécuter immédiatement
    performFullCleanup();
    
    // Puis à nouveau après des délais pour s'assurer que tout est propre
    const timer1 = setTimeout(performFullCleanup, 300);
    const timer2 = setTimeout(performFullCleanup, 1000);
    const timer3 = setTimeout(performFullCleanup, 2000);
    
    return () => {
      isMounted.current = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return null; // Composant sans rendu
};

export default AuthCleanup;
