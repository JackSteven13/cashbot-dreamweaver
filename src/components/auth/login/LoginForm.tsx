
import React, { useState, useEffect } from 'react';
import { LoginButton, LoginFields, useLoginFormState, useLoginSubmit } from './form';
import { pingSupabaseServer } from '@/integrations/supabase/client';

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
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [serverReachable, setServerReachable] = useState<boolean | null>(null);

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

  const onSubmit = async (e: React.FormEvent) => {
    if (validateForm()) {
      handleSubmit(e, email, password, setIsLoading);
    } else {
      e.preventDefault();
    }
  };
  
  const handleRetry = async () => {
    setIsLoading(true);
    try {
      const isReachable = await pingSupabaseServer();
      setServerReachable(isReachable);
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifier l'accessibilité du serveur au chargement
  useEffect(() => {
    const checkServerAccess = async () => {
      try {
        const networkOnline = navigator.onLine;
        setIsOnline(networkOnline);
        
        if (!networkOnline) {
          setServerReachable(false);
          return;
        }
        
        const isReachable = await pingSupabaseServer();
        setServerReachable(isReachable);
      } catch (error) {
        console.error("Erreur lors du test de connexion:", error);
        setServerReachable(false);
      }
    };
    
    checkServerAccess();
    
    // Ajouter des écouteurs pour les changements de statut en ligne
    const handleOnline = () => {
      setIsOnline(true);
      checkServerAccess();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setServerReachable(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
          <p className="font-medium">Serveur inaccessible</p>
          <p className="text-xs mt-1 text-red-300/80">
            Impossible de contacter le serveur d'authentification.
            Veuillez réessayer ultérieurement.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-2 text-xs text-blue-300 hover:text-blue-200 transition-colors"
          >
            Vérifier à nouveau
          </button>
        </div>
      )}
      
      {isOnline === false && (
        <div className="bg-red-950/30 border border-red-700/50 p-3 rounded-md text-sm text-red-200">
          <p className="font-medium">Connexion internet non disponible</p>
          <p className="text-xs mt-1 text-red-300/80">
            Vérifiez votre connexion et réessayez.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 text-xs text-blue-300 hover:text-blue-200 transition-colors"
          >
            Actualiser
          </button>
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
        <LoginButton 
          isLoading={isLoading} 
          disabled={serverReachable === false || isOnline === false}
        />
      </div>
    </form>
  );
};

export default LoginForm;
