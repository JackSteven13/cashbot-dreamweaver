
import { FC, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const AuthLoadingScreen: FC = () => {
  const [loadingTime, setLoadingTime] = useState(0);
  const [dots, setDots] = useState('');
  
  // Effet pour gérer le temps de chargement
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Effet pour les points d'animation
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '');
    }, 500);
    
    return () => clearInterval(dotsInterval);
  }, []);
  
  // Afficher un message différent selon la durée de chargement
  const getMessage = () => {
    if (loadingTime > 10) {
      return (
        <>
          <span className="text-yellow-300 mb-2 block">
            Le chargement prend plus de temps que prévu{dots}
          </span>
          <span className="text-xs text-blue-200">
            Connexion réseau en cours...
          </span>
        </>
      );
    } else if (loadingTime > 5) {
      return (
        <>
          <span className="text-blue-300 mb-2 block">
            Vérification de l'authentification en cours{dots}
          </span>
          <span className="text-xs text-blue-200">
            Cela peut prendre quelques instants
          </span>
        </>
      );
    }
    
    return (
      <>
        <span className="text-blue-300 mb-2 block">Vérification de l'authentification{dots}</span>
        <span className="text-xs text-blue-200">Cela peut prendre quelques secondes</span>
      </>
    );
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-4" />
      <div className="text-center px-4">
        {getMessage()}
        
        {loadingTime > 20 && (
          <div className="mt-6 text-xs text-yellow-200">
            Vous semblez avoir des difficultés à vous connecter.
            <br />Veuillez actualiser la page ou vérifier votre connexion Internet.
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
