
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthData } from '@/lib/supabase';

const AuthCleanup = () => {
  const cleanupDone = useRef(false);
  
  // Nettoyer les données d'authentification de façon agressive
  useEffect(() => {
    if (cleanupDone.current) return;
    
    const performCleanup = async () => {
      console.log("🧹 AuthCleanup: Nettoyage agressif des données d'authentification");
      
      // Premier nettoyage complet
      clearAuthData();
      
      try {
        // Déconnexion explicite d'abord avec des options de sécurité maximales
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.log("Erreur de déconnexion ignorée:", e);
      }
      
      // Petit délai pour s'assurer que toutes les opérations asynchrones sont terminées
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Second nettoyage pour s'assurer que tout est propre
      clearAuthData();
      
      // Marquer comme terminé
      cleanupDone.current = true;
      
      console.log("🧹 AuthCleanup: Nettoyage terminé");
    };
    
    performCleanup();
  }, []);

  return null; // Composant sans rendu
};

export default AuthCleanup;
