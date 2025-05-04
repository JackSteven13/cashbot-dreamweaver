
import { useState, useEffect } from 'react';
import { clearStoredAuthData } from "@/integrations/supabase/client";

export const useLoginFormState = (lastLoggedInEmail: string | null) => {
  const [email, setEmail] = useState(lastLoggedInEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Nettoyer les données d'authentification au chargement du formulaire
  useEffect(() => {
    console.log("Formulaire de connexion initialisé, nettoyage radical des données d'authentification");
    
    // Fonction de nettoyage
    const performCleanup = () => {
      // Nettoyage initial pour partir d'un état propre
      clearStoredAuthData();
    };
    
    // Exécuter immédiatement
    performCleanup();
    
    // Puis réexécuter après un court délai
    const timer = setTimeout(performCleanup, 500);
    
    return () => clearTimeout(timer);
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
