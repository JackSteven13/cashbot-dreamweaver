
import React, { useState, useEffect } from 'react';
import { LoginButton, LoginFields, useLoginFormState, useLoginSubmit } from './form';
import { pingSupabaseServer, testConnectivity } from '@/integrations/supabase/client';
import { NetworkStatusAlert } from '@/components/ui/alert-dns';

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
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

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
    // Vérifie la connexion avant de soumettre le formulaire
    if (serverReachable === false) {
      // Si le serveur est déjà marqué comme inaccessible, faire une nouvelle vérification
      const isReachable = await pingSupabaseServer();
      setServerReachable(isReachable);
      if (!isReachable) {
        e.preventDefault();
        setFormError('Serveur toujours inaccessible. Veuillez réessayer ultérieurement.');
        return;
      }
    }
    
    if (validateForm()) {
      handleSubmit(e, email, password, setIsLoading);
    } else {
      e.preventDefault();
    }
  };
  
  const handleHelpClick = () => {
    window.open('https://streamgenius.io/help/connection', '_blank');
  };

  // Vérifier l'accessibilité du serveur au chargement
  useEffect(() => {
    const checkServerAccess = async () => {
      try {
        const isNetworkOnline = navigator.onLine;
        setIsOnline(isNetworkOnline);
        
        if (!isNetworkOnline) {
          setServerReachable(false);
          return;
        }
        
        const isReachable = await pingSupabaseServer();
        setServerReachable(isReachable);
        
        // Si le serveur n'est pas joignable, vérifier si c'est un problème de connexion internet
        if (!isReachable) {
          const hasInternet = await testConnectivity();
          setIsOnline(hasInternet);
        }
      } catch (error) {
        console.error("Erreur lors du test de connexion:", error);
        setServerReachable(false);
      }
    };
    
    checkServerAccess();
    
    // Vérification périodique du serveur
    const intervalId = setInterval(checkServerAccess, 20000); // toutes les 20 secondes
    
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
      clearInterval(intervalId);
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
            onClick={async () => {
              setIsLoading(true);
              const isReachable = await pingSupabaseServer();
              setServerReachable(isReachable);
              setIsLoading(false);
            }}
            className="mt-2 text-xs text-blue-300 hover:text-blue-200 transition-colors"
          >
            Vérifier à nouveau
          </button>
        </div>
      )}
      
      {isOnline === false && (
        <NetworkStatusAlert isOnline={false} onHelp={handleHelpClick} />
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
