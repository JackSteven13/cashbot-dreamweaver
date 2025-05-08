
import React, { useState, useEffect, useRef } from 'react';
import { LoginButton, LoginFields, useLoginSubmit } from './form';
import { clearStoredAuthData, checkSupabaseConnectivity } from "@/integrations/supabase/client";

interface LoginFormProps {
  lastLoggedInEmail: string | null;
}

const LoginForm = ({ lastLoggedInEmail }: LoginFormProps) => {
  // État local du formulaire
  const [email, setEmail] = useState(lastLoggedInEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const formSubmitted = useRef(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  
  // Hook personnalisé pour gérer la soumission
  const { handleSubmit } = useLoginSubmit();

  // Nettoyer toutes les données d'authentification au chargement
  useEffect(() => {
    console.log("Nettoyage initial des données d'authentification");
    clearStoredAuthData();
    
    // Vérifier la connectivité à Supabase au chargement du formulaire
    const checkConnectivity = async () => {
      setConnectionStatus('checking');
      try {
        const isConnected = await checkSupabaseConnectivity();
        if (!isConnected && !formSubmitted.current) {
          setFormError("La connexion au serveur n'a pas pu être établie. Veuillez vérifier votre connexion internet.");
          setConnectionStatus('error');
        } else {
          setConnectionStatus('connected');
        }
      } catch (err) {
        console.error("Erreur lors de la vérification de connectivité:", err);
        setConnectionStatus('error');
        setFormError("Erreur lors de la vérification de la connexion au serveur.");
      }
    };
    
    checkConnectivity();
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
    formSubmitted.current = true;
    
    if (validateForm()) {
      // Si le formulaire est valide, vérifier une dernière fois la connectivité
      const isConnected = await checkSupabaseConnectivity();
      if (!isConnected) {
        setFormError("Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet et réessayer.");
        return;
      }
      
      handleSubmit(e, email, password, setIsLoading, setFormError);
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
      {connectionStatus === 'checking' && (
        <div className="bg-blue-950/30 border border-blue-700/50 p-3 rounded-md text-sm text-blue-200 flex items-center">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></div>
          Vérification de la connexion au serveur...
        </div>
      )}
      
      {connectionStatus === 'error' && !formError && (
        <div className="bg-red-950/30 border border-red-700/50 p-3 rounded-md text-sm text-red-200">
          Problème de connexion au serveur. Le formulaire reste disponible mais pourrait ne pas fonctionner correctement.
        </div>
      )}
      
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
