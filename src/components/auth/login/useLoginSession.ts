
import { useState, useEffect } from 'react';

export const useLoginSession = () => {
  const [lastLoggedInEmail, setLastLoggedInEmail] = useState<string | null>(null);
  
  useEffect(() => {
    // Récupérer l'email précédemment utilisé
    const savedEmail = localStorage.getItem('last_logged_in_email');
    if (savedEmail) {
      setLastLoggedInEmail(savedEmail);
    }
  }, []);

  return { lastLoggedInEmail };
};

export default useLoginSession;
