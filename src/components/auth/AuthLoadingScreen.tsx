
import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthLoadingScreenProps {
  onManualRetry?: () => void;
}

const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({ onManualRetry }) => {
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showRetry, setShowRetry] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Messages plus informatifs pour l'utilisateur
  const loadingMessages = [
    "Vérification de votre identité",
    "Préparation de votre environnement",
    "Chargement de votre profil"
  ];

  // Effet pour faire avancer les phases de chargement et simuler une progression
  useEffect(() => {
    const stepTimer = setTimeout(() => {
      setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 1800);
    
    // Simuler une progression
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // Calculer la nouvelle valeur avec une légère variation aléatoire
        const increment = Math.random() * 2 + 1; // Entre 1 et 3
        const newValue = prev + increment;
        
        // Limiter la progression en fonction de l'étape
        const maxProgress = (loadingStep + 1) * 33.33;
        return Math.min(newValue, maxProgress);
      });
    }, 200);
    
    return () => {
      clearTimeout(stepTimer);
      clearInterval(progressInterval);
    };
  }, [loadingStep, loadingMessages.length]);

  // Timeout pour montrer l'option de réessayer si ça prend trop de temps
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setShowRetry(true);
    }, 12000); // Afficher après 12 secondes
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleManualRetry = () => {
    // Réinitialiser
    setLoadingStep(0);
    setProgress(0);
    setShowRetry(false);
    
    // Appeler la fonction de retry si fournie
    if (onManualRetry) {
      onManualRetry();
    }
    
    // Réinitialiser le timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowRetry(true);
    }, 12000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a20] items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo animé */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-lg opacity-50 animate-pulse"></div>
            <div className="relative w-20 h-20 mx-auto">
              <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full fill-blue-400"
              >
                <path d="M50,10 C70,10 85,25 85,50 C85,75 70,90 50,90 C30,90 15,75 15,50 C15,25 30,10 50,10 Z" 
                  className="opacity-20" />
                <path 
                  d="M50,10 C70,10 85,25 85,50 C85,75 70,90 50,90"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="origin-center animate-spin"
                  style={{ animationDuration: '3s' }}
                />
                <circle cx="50" cy="50" r="5" className="fill-white" />
                <circle cx="85" cy="50" r="5" className="fill-blue-200 animate-pulse" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-blue-300 text-2xl font-bold mb-1">Stream Genius</h2>
          <p className="text-blue-400 mb-3 text-lg font-medium">
            {loadingMessages[loadingStep]}
          </p>
        </div>
        
        {/* Barre de progression */}
        <div className="w-full bg-slate-800/40 h-2 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {showRetry && (
          <div className="mt-8 text-center">
            <p className="text-yellow-300 text-sm mb-3">
              Le chargement semble prendre plus de temps que prévu
            </p>
            <button 
              onClick={handleManualRetry}
              className="px-4 py-2 bg-blue-800/30 hover:bg-blue-700/40 text-blue-300 border border-blue-700/50 rounded-md transition-colors"
            >
              <svg className="w-4 h-4 inline-block mr-2 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22C10.1435 22 8.36301 21.2625 7.05025 20.0497C5.7375 18.837 5 17.0565 5 15.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 15L5 15.2L5.2 19.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Réessayer la vérification
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
