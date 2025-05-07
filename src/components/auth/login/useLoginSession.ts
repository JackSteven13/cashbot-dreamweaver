
import { useState, useEffect } from 'react';

export const useLoginSession = () => {
  const [lastLoggedInEmail, setLastLoggedInEmail] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      // Récupérer l'email précédemment utilisé
      const savedEmail = localStorage.getItem('last_logged_in_email');
      if (savedEmail) {
        console.log("Email précédemment utilisé récupéré:", savedEmail);
        setLastLoggedInEmail(savedEmail);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'email précédent:", error);
    }
  }, []);

  return { lastLoggedInEmail };
};

export default useLoginSession;
