
import { useState, useEffect } from 'react';
import { clearStoredAuthData } from '@/integrations/supabase/client';

export const useLoginSession = () => {
  const [lastLoggedInEmail, setLastLoggedInEmail] = useState<string | null>(null);
  
  useEffect(() => {
    // Nettoyer d'abord les données d'authentification de manière agressive
    clearStoredAuthData();
    
    // Court délai pour s'assurer que le nettoyage est effectif
    setTimeout(() => {
      // Puis récupérer l'email précédemment utilisé
      try {
        const savedEmail = localStorage.getItem('last_logged_in_email');
        if (savedEmail) {
          console.log("Email précédemment utilisé récupéré:", savedEmail);
          setLastLoggedInEmail(savedEmail);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'email précédent:", error);
      }
    }, 100);
    
    // Nettoyage supplémentaire après un délai plus long
    const timer = setTimeout(clearStoredAuthData, 800);
    
    return () => clearTimeout(timer);
  }, []);

  return { lastLoggedInEmail };
};
