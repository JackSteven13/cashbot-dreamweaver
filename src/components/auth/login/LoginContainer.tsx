
import React, { useEffect } from 'react';
import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';
import LoginLinks from './LoginLinks';
import PreviousLoginInfo from './PreviousLoginInfo';
import AuthCleanup from './AuthCleanup';
import NetworkStatusIndicator from './NetworkStatusIndicator';
import { toast } from '@/hooks/use-toast';

interface LoginContainerProps {
  lastLoggedInEmail: string | null;
}

const LoginContainer = ({ lastLoggedInEmail }: LoginContainerProps) => {
  // Vérification de l'état de la connexion internet
  useEffect(() => {
    const checkOnlineStatus = () => {
      if (!navigator.onLine) {
        toast({
          title: "Connexion internet indisponible",
          description: "Vous êtes hors ligne. La connexion nécessite une connexion internet active.",
          variant: "destructive",
          duration: 5000
        });
      }
    };
    
    // Vérifier au chargement
    checkOnlineStatus();
    
    // Configurer les écouteurs d'événements pour détecter les changements d'état de la connexion
    window.addEventListener('online', () => {
      toast({
        title: "Connexion internet rétablie",
        description: "Vous pouvez maintenant vous connecter.",
        duration: 3000
      });
    });
    
    window.addEventListener('offline', () => {
      toast({
        title: "Connexion internet perdue",
        description: "Vous êtes hors ligne. La connexion nécessite une connexion internet active.",
        variant: "destructive",
        duration: 5000
      });
    });
    
    return () => {
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
    };
  }, []);

  return (
    <div className="w-full max-w-md px-4">
      {/* Composant invisible qui nettoie les données d'authentification */}
      <AuthCleanup />
      
      <LoginHeader />
      
      <div className="glass-panel p-6 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <PreviousLoginInfo lastLoggedInEmail={lastLoggedInEmail} />
          <NetworkStatusIndicator className="ml-auto" />
        </div>
        
        <LoginForm lastLoggedInEmail={lastLoggedInEmail} />
        <LoginLinks />
      </div>
    </div>
  );
};

export default LoginContainer;
