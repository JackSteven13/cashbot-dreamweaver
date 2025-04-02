
import { FC, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const AuthLoadingScreen: FC = () => {
  const [loadingTime, setLoadingTime] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Afficher un message différent après 5 secondes
  const getMessage = () => {
    if (loadingTime > 10) {
      return (
        <>
          <span className="text-yellow-300 mb-2 block">
            Le chargement prend plus de temps que prévu...
          </span>
          <span className="text-xs text-blue-200">
            Nous travaillons à résoudre le problème
          </span>
        </>
      );
    } else if (loadingTime > 5) {
      return (
        <>
          <span className="text-blue-300 mb-2 block">
            Vérification de l'authentification en cours...
          </span>
          <span className="text-xs text-blue-200">
            Cela peut prendre quelques instants
          </span>
        </>
      );
    }
    
    return (
      <>
        <span className="text-blue-300 mb-2 block">Vérification de l'authentification...</span>
        <span className="text-xs text-blue-200">Cela peut prendre quelques secondes</span>
      </>
    );
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-4" />
      <div className="text-center">
        {getMessage()}
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
