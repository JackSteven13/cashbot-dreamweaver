
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthLoadingScreenProps {
  onManualRetry?: () => void;
}

const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({ onManualRetry }) => {
  const [loadingStep, setLoadingStep] = useState(0);
  const [dots, setDots] = useState('');
  const [showRetry, setShowRetry] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Timeout pour montrer l'option de réessayer si ça prend trop de temps
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setShowRetry(true);
    }, 15000); // Afficher après 15 secondes
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleManualRetry = () => {
    // Réinitialiser
    setLoadingStep(0);
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
    }, 15000);
  };

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
        
        {showRetry && (
          <div className="mt-6">
            <p className="text-yellow-300 text-sm mb-3">
              Le chargement semble prendre plus de temps que prévu
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualRetry}
              className="bg-blue-800/30 hover:bg-blue-700/40 text-blue-300 border-blue-700/50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer la vérification
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
