
import { useState, useEffect } from 'react';
import { clearStoredAuthData } from "@/integrations/supabase/client";

export const useLoginFormState = (lastLoggedInEmail: string | null) => {
  const [email, setEmail] = useState(lastLoggedInEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Nettoyage radical au chargement du formulaire, une seule fois
  useEffect(() => {
    clearStoredAuthData();
  }, []);

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    setIsLoading
  };
};

export default useLoginFormState;
