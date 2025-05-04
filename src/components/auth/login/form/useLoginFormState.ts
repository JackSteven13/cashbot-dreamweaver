
import { useState, useEffect } from 'react';
import { clearStoredAuthData } from "@/integrations/supabase/client";

export const useLoginFormState = (lastLoggedInEmail: string | null) => {
  const [email, setEmail] = useState(lastLoggedInEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Nettoyer les données d'authentification au chargement du formulaire
  useEffect(() => {
    console.log("Formulaire de connexion initialisé, nettoyage des données d'authentification");
    // Nettoyage initial pour partir d'un état propre
    clearStoredAuthData();
    
    // Nettoyages supplémentaires des flags qui pourraient bloquer l'authentification
    localStorage.removeItem('auth_checking');
    localStorage.removeItem('auth_refreshing');
    localStorage.removeItem('auth_redirecting');
    localStorage.removeItem('auth_redirect_timestamp');
    localStorage.removeItem('auth_check_timestamp');
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
