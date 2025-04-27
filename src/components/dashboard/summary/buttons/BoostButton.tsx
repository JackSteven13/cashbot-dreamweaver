
import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface BoostButtonProps {
  canStartSession: boolean;
  limitReached?: boolean;
  limitPercentage?: number;
  isStartingSession: boolean;
  isButtonDisabled?: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement>;
  onClick: () => void;
  handleStartSession?: () => void;
  subscription?: string;
}

export const BoostButton: React.FC<BoostButtonProps> = ({
  canStartSession,
  limitReached = false,
  limitPercentage = 0,
  isStartingSession,
  isButtonDisabled = false,
  buttonRef,
  onClick,
  handleStartSession, // Support pour l'ancienne API
  subscription
}) => {
  const isMobile = useIsMobile();
  const iconSize = isMobile ? 16 : 18;
  const [isClicked, setIsClicked] = useState(false);
  const [isFreemiumLimited, setIsFreemiumLimited] = useState(false);
  
  // Vérifier si le compte freemium a atteint sa limite quotidienne
  useEffect(() => {
    const checkFreemiumLimit = () => {
      if (subscription === 'freemium') {
        const limitReached = localStorage.getItem('freemium_daily_limit_reached');
        const lastSessionDate = localStorage.getItem('last_session_date');
        const today = new Date().toDateString();
        
        // Si ce n'est pas un nouveau jour et que la limite est déjà atteinte
        const isLimited = lastSessionDate === today && limitReached === 'true';
        setIsFreemiumLimited(isLimited);
        
        // Déclencher un événement pour mettre à jour l'interface si la limite a changé
        if (isLimited !== isFreemiumLimited) {
          window.dispatchEvent(new CustomEvent('freemium:limit-changed', {
            detail: { limited: isLimited }
          }));
        }
        
        return isLimited;
      }
      return false;
    };
    
    checkFreemiumLimit();
    
    // Vérifier périodiquement la limite pour les comptes freemium
    const intervalId = setInterval(checkFreemiumLimit, 5000);
    
    // Vérifier aussi à chaque changement de visibilité du document
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkFreemiumLimit();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Écouter l'événement de fin de session pour mettre à jour l'état
    const handleSessionComplete = () => {
      if (subscription === 'freemium') {
        setTimeout(() => {
          checkFreemiumLimit();
        }, 500);
      }
    };
    
    window.addEventListener('session:completed' as any, handleSessionComplete);
    
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('session:completed' as any, handleSessionComplete);
    };
  }, [subscription, isFreemiumLimited]);
  
  // Gérer le clic avec un feedback visuel supplémentaire
  const handleClick = () => {
    if (isButtonDisabled || isStartingSession || limitReached || isFreemiumLimited) return;
    
    setIsClicked(true);
    
    // Support pour l'ancienne et la nouvelle API
    if (handleStartSession) {
      handleStartSession();
    } else {
      onClick();
    }
    
    // Réinitialiser l'état cliqué après un délai
    setTimeout(() => {
      setIsClicked(false);
    }, 1000);
  };
  
  // Les classes pour l'animation
  const animationClass = isStartingSession 
    ? 'boost-button-active' 
    : isClicked 
      ? 'boost-button-clicked'
      : 'boost-button-pulse';
      
  // Déterminer le contenu et l'état du bouton
  const buttonContent = () => {
    if (isStartingSession) {
      return (
        <span className="flex items-center">
          <Activity className="animate-pulse mr-1.5" size={iconSize} />
          <span className="processing-dots">Analyse en cours</span>
        </span>
      );
    } else if (isFreemiumLimited) {
      return (
        <span className="flex items-center">
          <AlertTriangle className="mr-1.5" size={iconSize} />
          Limite (1/jour)
        </span>
      );
    } else if (limitReached) {
      return (
        <span className="flex items-center">
          <AlertTriangle className="mr-1.5" size={iconSize} />
          Limite atteinte
        </span>
      );
    } else {
      return (
        <span className="flex items-center">
          <Zap className="mr-1.5" size={iconSize} />
          Lancer l'analyse
        </span>
      );
    }
  };
  
  // Déterminer les styles et l'état du bouton
  const getButtonStyles = () => {
    if (isFreemiumLimited) {
      return "w-full bg-red-600 hover:bg-red-600 text-white cursor-not-allowed shadow-md py-1.5";
    } else if (limitReached) {
      return "w-full bg-slate-300 hover:bg-slate-300 text-slate-600 cursor-not-allowed shadow-md py-1.5";
    } else if (canStartSession) {
      return `w-full bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] hover:from-[#2563eb] hover:to-[#1e40af] text-white relative overflow-hidden shadow-md py-1.5 ${animationClass}`;
    } else {
      return "w-full bg-slate-300 hover:bg-slate-300 text-slate-600 cursor-not-allowed shadow-md py-1.5";
    }
  };
  
  return (
    <Button 
      ref={buttonRef}
      className={getButtonStyles()}
      disabled={isButtonDisabled || isStartingSession || limitReached || isFreemiumLimited}
      onClick={handleClick}
      size={isMobile ? "sm" : "default"}
    >
      {/* Visual indicator of progress towards limit */}
      {canStartSession && !limitReached && !isFreemiumLimited && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-white/50" 
          style={{ width: `${limitPercentage}%` }}
        />
      )}
      
      {buttonContent()}
    </Button>
  );
};

export default BoostButton;
