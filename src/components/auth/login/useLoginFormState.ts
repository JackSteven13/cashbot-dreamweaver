
import { useState, useEffect } from 'react';
import { clearStoredAuthData } from "@/integrations/supabase/client";

export const useLoginFormState = (lastLoggedInEmail: string | null) => {
  const [email, setEmail] = useState(lastLoggedInEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Nettoyer agressivement les données d'authentification au chargement du formulaire
  useEffect(() => {
    console.log("🧹 LoginFormState: Nettoyage des données d'authentification");
    
    // Premier nettoyage immédiat
    clearStoredAuthData();
    
    // Second nettoyage après un court délai
    const timer1 = setTimeout(clearStoredAuthData, 300);
    
    // Troisième nettoyage pour s'assurer que tout est propre
    const timer2 = setTimeout(clearStoredAuthData, 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
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
