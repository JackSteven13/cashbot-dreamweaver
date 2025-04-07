
import { FC, useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

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
      {/* Logo animé amélioré */}
      <div className="mb-8">
        <div className="relative w-28 h-28 mx-auto">
          {/* Effet de lueur en arrière-plan */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-xl opacity-30 animate-pulse"></div>
          
          {/* Cercle principal */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Cercle extérieur animé */}
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 100 100" 
              className="absolute inset-0"
            >
              <defs>
                <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              
              {/* Cercle complet en arrière-plan avec faible opacité */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#1e3a8a"
                strokeWidth="4"
                strokeOpacity="0.2"
              />
              
              {/* Arc animé qui tourne */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#circleGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset="100"
                transform="rotate(-90 50 50)"
                className="origin-center animate-spin"
                style={{ animationDuration: '1.5s', animationTimingFunction: 'linear' }}
              />
              
              {/* Points d'accent */}
              <circle cx="50" cy="10" r="3" fill="#93c5fd" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
              <circle cx="50" cy="90" r="3" fill="#3b82f6" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
              
              {/* Petit cercle central */}
              <circle cx="50" cy="50" r="5" fill="#f0f9ff" />
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
      
      {/* Barre de progression stylisée avec le composant Progress */}
      <div className="w-full max-w-md mx-auto mb-8">
        <Progress value={progress} className="h-2 bg-slate-800/40" />
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
