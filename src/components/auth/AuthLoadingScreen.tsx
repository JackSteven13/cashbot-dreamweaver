
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const AuthLoadingScreen: React.FC = () => {
  const [loadingStep, setLoadingStep] = useState(0);
  const [dots, setDots] = useState('');

  // Messages plus informatifs pour l'utilisateur
  const loadingMessages = [
    "Vérification de session",
    "Authentification en cours",
    "Chargement de votre profil"
  ];

  // Effet pour faire avancer les phases de chargement
  useEffect(() => {
    const stepTimer = setTimeout(() => {
      setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 1800);
    
    return () => clearTimeout(stepTimer);
  }, [loadingStep, loadingMessages.length]);

  // Effet pour l'animation des points
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);
    
    return () => clearInterval(dotsInterval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f23] items-center justify-center px-4">
      <div className="relative mb-6">
        <div className="absolute -inset-4 rounded-full opacity-30 blur-lg bg-blue-500 animate-pulse"></div>
        <Loader2 className="w-16 h-16 animate-spin text-blue-400 relative" />
      </div>
      
      <div className="text-center">
        <p className="text-blue-300 text-xl font-medium transition-all duration-300">
          {loadingMessages[loadingStep]}{dots}
        </p>
        
        <p className="mt-3 text-sm text-blue-200/70 max-w-xs">
          Si le chargement persiste, essayez de rafraîchir la page
        </p>
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
