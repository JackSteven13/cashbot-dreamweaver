
import React, { useState, useEffect } from 'react';
import { LoginButton, LoginFields, useLoginFormState, useLoginSubmit } from './form';
import { testSupabaseConnection } from '@/lib/supabase';

interface LoginFormProps {
  lastLoggedInEmail: string | null;
}

const LoginForm = ({ lastLoggedInEmail }: LoginFormProps) => {
  const { 
    email, 
    setEmail, 
    password, 
    setPassword, 
    isLoading, 
    setIsLoading 
  } = useLoginFormState(lastLoggedInEmail);
  
  const { handleSubmit } = useLoginSubmit();
  const [formError, setFormError] = useState<string | null>(null);
  const [serverReachable, setServerReachable] = useState<boolean | null>(null);

  // Tester la connexion à Supabase au chargement
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await testSupabaseConnection(2);
        setServerReachable(isConnected);
      } catch (error) {
        console.error("Erreur lors du test de connectivité:", error);
        setServerReachable(false);
      }
    };
    
    checkConnection();
    
    // Vérifie périodiquement la connectivité
    const interval = setInterval(checkConnection, 60000); // Vérifier toutes les 60 secondes
    
    return () => clearInterval(interval);
  }, []);

  // Vérifier la validité du formulaire avant soumission
  const validateForm = () => {
    if (!email || !email.includes('@')) {
      setFormError('Veuillez saisir un email valide');
      return false;
    }
    if (!password || password.length < 6) {
      setFormError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    setFormError(null);
    return true;
  };

  const onSubmit = (e: React.FormEvent) => {
    if (validateForm()) {
      handleSubmit(e, email, password, setIsLoading);
    } else {
      e.preventDefault();
    }
  };

  // Effacer les erreurs lorsque les champs changent
  useEffect(() => {
    if (formError) setFormError(null);
  }, [email, password]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {formError && (
        <div className="bg-red-950/30 border border-red-700/50 p-3 rounded-md text-sm text-red-200">
          {formError}
        </div>
      )}
      
      {serverReachable === false && (
        <div className="bg-red-950/30 border border-red-700/50 p-3 rounded-md text-sm text-red-200">
          Serveur inaccessible - Impossible de contacter le serveur d'authentification.
          Veuillez réessayer ultérieurement.
        </div>
      )}
      
      <LoginFields
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isLoading={isLoading}
      />
      
      <div className="pt-2">
        <LoginButton isLoading={isLoading} disabled={serverReachable === false} />
      </div>
    </form>
  );
};

export default LoginForm;
