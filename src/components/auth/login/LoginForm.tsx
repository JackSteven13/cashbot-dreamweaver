
import React, { useState, useEffect } from 'react';
import { LoginButton, LoginFields, useLoginSubmit } from './form';
import { clearStoredAuthData, testSupabaseConnection } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface LoginFormProps {
  lastLoggedInEmail: string | null;
}

const LoginForm = ({ lastLoggedInEmail }: LoginFormProps) => {
  // État local du formulaire
  const [email, setEmail] = useState(lastLoggedInEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);
  
  // Hook personnalisé pour gérer la soumission
  const { handleSubmit } = useLoginSubmit();

  // Nettoyer toutes les données d'authentification au chargement
  useEffect(() => {
    // Nettoyage des données d'authentification existantes
    clearStoredAuthData();
    
    // Vérifier la connexion au service Supabase
    const checkService = async () => {
      const isAvailable = await testSupabaseConnection();
      setServiceAvailable(isAvailable);
      
      if (!isAvailable && navigator.onLine) {
        setFormError('Problème de connexion au service. Veuillez réessayer dans quelques instants.');
      } else if (!navigator.onLine) {
        setFormError('Vous semblez être hors ligne. Vérifiez votre connexion internet.');
      }
    };
    
    checkService();

    // Écouter les changements de connectivité
    const handleOnline = () => {
      setFormError(null);
      checkService();
    };
    
    const handleOffline = () => {
      setFormError('Vous êtes actuellement hors ligne.');
      setServiceAvailable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!navigator.onLine) {
      setFormError('Pas de connexion internet. Veuillez vérifier votre connexion et réessayer.');
      setIsLoading(false);
      return;
    }
    
    // Vérifier à nouveau la disponibilité du service
    try {
      const isAvailable = await testSupabaseConnection();
      
      if (!isAvailable) {
        setFormError('Le service est momentanément indisponible. Veuillez réessayer dans quelques instants.');
        setIsLoading(false);
        return;
      }
      
      // Service disponible, validation du formulaire et soumission
      if (validateForm()) {
        handleSubmit(e, email, password, setIsLoading, setFormError);
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      console.error("Erreur lors du test de disponibilité:", e);
      setFormError("Une erreur s'est produite lors de la vérification du service. Veuillez réessayer.");
      setIsLoading(false);
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
