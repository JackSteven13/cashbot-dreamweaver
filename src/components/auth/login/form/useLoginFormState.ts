
import { useState, useEffect } from 'react';
import { clearStoredAuthData } from "@/integrations/supabase/client";

export const useLoginFormState = (lastLoggedInEmail: string | null) => {
  const [email, setEmail] = useState(lastLoggedInEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Nettoyer les données d'authentification au chargement du formulaire
  useEffect(() => {
    console.log("Formulaire de connexion initialisé, nettoyage des données d'authentification");
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
