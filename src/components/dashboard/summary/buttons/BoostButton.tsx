
import React from 'react';
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
  
  if (canStartSession && !limitReached) {
    return (
      <Button 
        ref={buttonRef}
        className={`w-full bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] hover:from-[#8B5CF6] hover:to-[#6C53AF] text-white relative overflow-hidden shadow-md py-1.5 ${isStartingSession ? 'boost-button-active' : 'boost-button-pulse'}`}
        disabled={isButtonDisabled || isStartingSession || limitReached}
        onClick={onClick}
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
            <span className="processing-dots">Analyse</span>
          </span>
        ) : limitReached ? (
          <span className="flex items-center">
            <AlertTriangle className="mr-1.5" size={iconSize} />
            Limite
          </span>
        ) : (
          <span className="flex items-center">
            <Zap className="mr-1.5" size={iconSize} />
            Boost
          </span>
        )}
        
        {/* Glow effect when inactive but ready */}
        {!isStartingSession && !limitReached && (
          <span className="absolute inset-0 rounded-md blur opacity-25 bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] animate-pulse"></span>
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
            Limite
          </span>
        ) : (
          <span className="flex items-center">
            <Zap className="mr-1.5" size={iconSize} />
            Boost
          </span>
        )}
      </Button>
    );
  }
};
