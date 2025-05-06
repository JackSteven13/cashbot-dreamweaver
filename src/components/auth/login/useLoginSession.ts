
import { useState, useEffect } from 'react';
import { supabase, clearStoredAuthData } from '@/integrations/supabase/client';

export const useLoginSession = () => {
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [lastLoggedInEmail, setLastLoggedInEmail] = useState<string | null>(null);

  // Effet pour la vérification initiale de session
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Nettoyer les données d'authentification pour éviter les problèmes
        clearStoredAuthData();
        
        // Récupérer le dernier email utilisé pour se connecter
        const savedEmail = localStorage.getItem('last_logged_in_email');
        setLastLoggedInEmail(savedEmail);
        
        // Simplification: juste marquer comme terminé
        setIsCheckingSession(false);
      } catch (error) {
        console.error("Erreur lors de la vérification de session:", error);
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  return { isCheckingSession, lastLoggedInEmail };
};

export default useLoginSession;
