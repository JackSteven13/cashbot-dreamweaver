
import { FC, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const DashboardLoading: FC = () => {
  const [loadingPhase, setLoadingPhase] = useState(0);
  const loadingMessages = [
    "Initialisation...",
    "Vérification de session...",
    "Chargement de votre tableau de bord..."
  ];
  
  // Effet pour faire avancer les phases de chargement progressivement
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingPhase((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 800);
    
    return () => clearTimeout(timer);
  }, [loadingPhase]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23] px-4">
      <div className="relative mb-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
        {/* Overlay pulse animation */}
        <div className="absolute inset-0 rounded-full animate-pulse bg-blue-400/20"></div>
      </div>
      
      <div className="text-center">
        <p className="text-blue-300 mb-2 text-lg font-medium transition-all duration-300">
          {loadingMessages[loadingPhase]}
        </p>
        <p className="text-xs text-blue-200 animate-pulse">Veuillez patienter...</p>
      </div>
    </div>
  );
};

export default DashboardLoading;
