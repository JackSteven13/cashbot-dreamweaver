
import React, { useState } from 'react';
import { LoginButton, LoginFields, useLoginFormState, useLoginSubmit } from './form';
import { isProductionEnvironment } from '@/integrations/supabase/client';
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
  
  const { handleSubmit } = useLoginSubmit();
  const [networkError, setNetworkError] = useState(false);

  // Vérifier la connectivité au service Supabase
  React.useEffect(() => {
    // Ne faire cette vérification qu'en production
    if (!isProductionEnvironment()) return;

    const checkConnectivity = async () => {
      try {
        const response = await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store'
        });
        setNetworkError(false);
      } catch (error) {
        console.error("Erreur de connectivité:", error);
        setNetworkError(true);
      }
    };
    
    checkConnectivity();
    
    // Vérifier toutes les 5 secondes
    const interval = setInterval(checkConnectivity, 5000);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    handleSubmit(e, email, password, setIsLoading);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {networkError && isProductionEnvironment() && (
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
