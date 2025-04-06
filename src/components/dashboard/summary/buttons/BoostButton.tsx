
import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface BoostButtonProps {
  canStartSession: boolean;
  limitReached: boolean;
  limitPercentage: number;
  isStartingSession: boolean;
  isButtonDisabled: boolean;
  buttonRef: React.RefObject<HTMLButtonElement>;
  onClick: () => void;
}

export const BoostButton: React.FC<BoostButtonProps> = ({
  canStartSession,
  limitReached,
  limitPercentage,
  isStartingSession,
  isButtonDisabled,
  buttonRef,
  onClick
}) => {
  const isMobile = useIsMobile();
  const iconSize = isMobile ? 16 : 18;
  const [isClicked, setIsClicked] = useState(false);
  
  // Gérer le clic avec un feedback visuel supplémentaire
  const handleClick = () => {
    if (isButtonDisabled || isStartingSession || limitReached) return;
    
    setIsClicked(true);
    onClick();
    
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
  
  if (canStartSession && !limitReached) {
    return (
      <Button 
        ref={buttonRef}
        className={`w-full bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] hover:from-[#2563eb] hover:to-[#1e40af] text-white relative overflow-hidden shadow-md py-1.5 ${animationClass}`}
        disabled={isButtonDisabled || isStartingSession || limitReached}
        onClick={handleClick}
        size={isMobile ? "sm" : "default"}
      >
        {/* Visual indicator of progress towards limit */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-white/50" 
          style={{ width: `${limitPercentage}%` }}
        />
        
        {isStartingSession ? (
          <span className="flex items-center">
            <Activity className="animate-pulse mr-1.5" size={iconSize} />
            <span className="processing-dots">Analyse en cours</span>
          </span>
        ) : limitReached ? (
          <span className="flex items-center">
            <AlertTriangle className="mr-1.5" size={iconSize} />
            Limite atteinte
          </span>
        ) : (
          <span className="flex items-center">
            <Zap className="mr-1.5" size={iconSize} />
            Lancer l'analyse
          </span>
        )}
      </Button>
    );
  } else {
    return (
      <Button 
        className="w-full bg-slate-300 hover:bg-slate-300 text-slate-600 cursor-not-allowed shadow-md py-1.5"
        disabled={true}
        size={isMobile ? "sm" : "default"}
      >
        {limitReached ? (
          <span className="flex items-center">
            <AlertTriangle className="mr-1.5" size={iconSize} />
            Limite atteinte
          </span>
        ) : (
          <span className="flex items-center">
            <Zap className="mr-1.5" size={iconSize} />
            Lancer l'analyse
          </span>
        )}
      </Button>
    );
  }
};
