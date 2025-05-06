
import { useEffect, useRef } from 'react';
import { clearStoredAuthData, supabase } from '@/integrations/supabase/client';

/**
 * Composant pour nettoyer radicalement toutes les données d'authentification
 */
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
          sessionStorage?.removeItem('supabase.auth.token');
          
          // 4. Supprimer explicitement tous les cookies liés à l'authentification
          const domains = ['', '.streamgenius.io', 'streamgenius.io'];
          const paths = ['/', '/auth', '/login'];
          
          const cookiesToRemove = ['sb-access-token', 'sb-refresh-token'];
          cookiesToRemove.forEach(cookieName => {
            domains.forEach(domain => {
              paths.forEach(path => {
                const domainPart = domain ? `domain=${domain};` : '';
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; ${domainPart}`;
              });
            });
          });
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
    
    return () => {
      isMounted.current = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return null; // Composant sans rendu
};

export default AuthCleanup;
