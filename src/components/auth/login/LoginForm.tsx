
import React, { useState, useEffect } from 'react';
import { LoginButton, LoginFields, useLoginFormState, useLoginSubmit } from './form';
import { isProductionEnvironment, checkNetworkConnectivity } from '@/lib/supabase';
import { AlertTriangle } from "lucide-react";

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
  
  const { handleSubmit, networkError } = useLoginSubmit();
  const [formError, setFormError] = useState<string | null>(null);

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
      {networkError && (
        <div className="bg-amber-950/30 border border-amber-700/50 p-3 rounded-md mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
            <div className="text-sm text-amber-200">
              <p className="font-medium">Connectivité limitée détectée</p>
              <p className="mt-1 text-xs">Si vous ne parvenez pas à vous connecter, essayez de:</p>
              <ul className="list-disc pl-4 mt-1 text-xs space-y-1">
                <li>Vérifier votre connexion internet</li>
                <li>Désactiver les bloqueurs de publicités</li>
                <li>Vider le cache de votre navigateur</li>
                <li>Essayer en navigation privée</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {formError && (
        <div className="bg-red-950/30 border border-red-700/50 p-3 rounded-md text-sm text-red-200">
          <AlertTriangle className="inline-block h-4 w-4 mr-1" />
          {formError}
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
        <LoginButton isLoading={isLoading} />
      </div>
    </form>
  );
};

export default LoginForm;
