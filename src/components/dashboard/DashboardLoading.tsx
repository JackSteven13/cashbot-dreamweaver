
import { FC, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const DashboardLoading: FC = () => {
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const loadingMessages = [
    "Initialisation du système...",
    "Analyse des données de contenu...",
    "Synchronisation de votre profil...",
    "Préparation du tableau de bord..."
  ];
  
  // Effet pour faire avancer les phases de chargement progressivement
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loadingPhase < loadingMessages.length - 1) {
        setLoadingPhase(prev => prev + 1);
        setProgress(0);
      }
    }, 1200);
    
    return () => clearTimeout(timer);
  }, [loadingPhase, loadingMessages.length]);
  
  // Effet pour animer la barre de progression
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 2;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a20] px-4">
      {/* Logo animé */}
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-lg opacity-50 animate-pulse"></div>
          <div className="relative w-24 h-24 mx-auto">
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
        <p className="text-blue-400 mb-2 text-lg font-medium transition-all duration-300">
          {loadingMessages[loadingPhase]}
        </p>
      </div>
      
      {/* Barre de progression stylisée */}
      <div className="w-full max-w-md mx-auto mb-8">
        <div className="bg-slate-800/40 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Initialisation</span>
          <span>{Math.min(100, Math.round(progress))}%</span>
          <span>Complet</span>
        </div>
      </div>
      
      <div className="flex flex-col items-center">
        <p className="text-xs text-blue-200/70 animate-pulse">
          Nous optimisons votre expérience...
        </p>
      </div>
    </div>
  );
};

export default DashboardLoading;
