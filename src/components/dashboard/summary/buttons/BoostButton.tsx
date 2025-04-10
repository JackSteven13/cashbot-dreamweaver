
import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Clock, AlertTriangle } from 'lucide-react';

export interface BoostButtonProps {
  isStartingSession: boolean;
  isButtonDisabled: boolean;
  onClick: () => void;
  remainingSessions: number | string;
  lastSessionTimestamp?: string;
  subscription: string;
  limitPercentage: number;
  canStartSession: boolean;
  isBotActive?: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

export const BoostButton = forwardRef<HTMLButtonElement, BoostButtonProps>(
  ({
    isStartingSession,
    isButtonDisabled,
    onClick,
    remainingSessions,
    lastSessionTimestamp,
    subscription,
    limitPercentage,
    canStartSession,
    isBotActive = true,
    buttonRef
  }, ref) => {
    // Calculer depuis combien de temps la dernière session a été lancée
    let timeAgo = '';
    if (lastSessionTimestamp) {
      const lastSession = new Date(lastSessionTimestamp);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 24) {
        timeAgo = `(il y a ${diffInHours}h)`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        timeAgo = `(il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''})`;
      }
    }
    
    // Déterminer le texte du bouton selon l'état
    const getButtonText = () => {
      if (isStartingSession) return 'Démarrage...';
      if (!canStartSession && limitPercentage >= 100) return 'Limite atteinte';
      if (subscription === 'freemium' && remainingSessions === 0) return 'Limite freemium';
      return 'Boost rapide';
    };
    
    const getButtonIcon = () => {
      if (isStartingSession) return <Clock className="animate-spin mr-2" size={16} />;
      if (!canStartSession && limitPercentage >= 100) return <AlertTriangle className="mr-2" size={16} />;
      return <PlayCircle className="mr-2" size={16} />;
    };
    
    // Déterminer la couleur du bouton
    const getButtonVariant = () => {
      if (!canStartSession || (subscription === 'freemium' && remainingSessions === 0)) {
        return 'destructive';
      }
      return 'default';
    };

    const getBottomText = () => {
      if (isButtonDisabled) return '';
      if (subscription === 'freemium' && typeof remainingSessions === 'number') {
        return `${remainingSessions} session${remainingSessions !== 1 ? 's' : ''} restante${remainingSessions !== 1 ? 's' : ''}`;
      }
      if (remainingSessions === 'illimitées') {
        return 'Sessions illimitées';
      }
      return '';
    };
    
    const getStatusColor = () => {
      if (!isBotActive) return 'text-red-400';
      if (limitPercentage >= 100) return 'text-red-400';
      if (limitPercentage >= 75) return 'text-yellow-400';
      return 'text-green-400';
    };
    
    // Calculer le statut d'activité du bot
    const getBotStatus = () => {
      if (!isBotActive) return 'Bot inactif';
      if (limitPercentage >= 100) return 'Limite atteinte';
      return 'Bot actif';
    };
    
    return (
      <div className="flex flex-col">
        <Button
          ref={buttonRef || ref}
          variant={getButtonVariant() as any}
          size="lg"
          disabled={isButtonDisabled || !canStartSession || (subscription === 'freemium' && remainingSessions === 0)}
          onClick={onClick}
          className="w-full relative overflow-hidden"
        >
          {getButtonIcon()}
          <span>{getButtonText()}</span>
          {limitPercentage > 0 && limitPercentage < 100 && (
            <div 
              className="absolute bottom-0 left-0 h-1 bg-green-500"
              style={{ width: `${limitPercentage}%`, transition: 'width 0.5s ease-in-out' }}
            />
          )}
        </Button>
        
        <div className="flex justify-between items-center mt-1 px-1 text-xs text-slate-400">
          <span className={`${getStatusColor()}`}>
            {getBotStatus()}
          </span>
          <span>
            {getBottomText()} {lastSessionTimestamp && timeAgo}
          </span>
        </div>
      </div>
    );
  }
);

BoostButton.displayName = 'BoostButton';
