
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useLoginSession = () => {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [lastLoggedInEmail, setLastLoggedInEmail] = useState<string | null>(null);
  
  // Version simplifiée qui ne vérifie pas la session mais récupère juste l'email mémorisé
  const checkExistingSession = async () => {
    // Ne pas essayer de vérifier la session automatiquement, juste récupérer l'email
    const savedEmail = localStorage.getItem('last_logged_in_email');
    if (savedEmail) {
      setLastLoggedInEmail(savedEmail);
    }
    
    // Terminer le chargement rapidement
    setIsCheckingSession(false);
  };
  
  useEffect(() => {
    const sessionTimeout = setTimeout(() => {
      setIsCheckingSession(false);
    }, 2000); // Réduire encore le délai pour éviter l'attente prolongée
    
    checkExistingSession();
    
    return () => clearTimeout(sessionTimeout);
  }, []);

  return { isCheckingSession, lastLoggedInEmail };
};
