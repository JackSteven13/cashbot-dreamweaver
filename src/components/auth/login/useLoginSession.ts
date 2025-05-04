
import { useState, useEffect } from 'react';
import { clearStoredAuthData } from '@/integrations/supabase/client';

export const useLoginSession = () => {
  const [lastLoggedInEmail, setLastLoggedInEmail] = useState<string | null>(null);
  
  useEffect(() => {
    // Nettoyer d'abord les données d'authentification
    clearStoredAuthData();
    
    // Puis récupérer l'email précédemment utilisé
    try {
      const savedEmail = localStorage.getItem('last_logged_in_email');
      if (savedEmail) {
        console.log("Email précédemment utilisé trouvé:", savedEmail);
        setLastLoggedInEmail(savedEmail);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'email précédent:", error);
    }
  }, []);

  return { lastLoggedInEmail };
};
