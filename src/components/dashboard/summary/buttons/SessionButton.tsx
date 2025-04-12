
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Lock, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SessionButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  subscription?: string;
  dailySessionCount?: number;
  canStart?: boolean;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const SessionButton: React.FC<SessionButtonProps> = ({
  onClick,
  isLoading = false,
  disabled = false,
  subscription = 'freemium',
  dailySessionCount = 0,
  canStart = true,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  // Limites de sessions quotidiennes par abonnement
  const getSessionLimit = () => {
    switch (subscription) {
      case 'pro':
      case 'premium':
        return 'illimité';
      case 'starter':
        return '12';
      case 'freemium':
      default:
        return '1';
    }
  };
  
  // Vérifier si l'utilisateur a atteint la limite de sessions
  const hasReachedLimit = subscription === 'freemium' && dailySessionCount >= 1;
  
  // Vérifier si la dernière session est récente (moins de 10 minutes)
  const isSessionRecent = () => {
    if (!lastSessionTimestamp) return false;
    
    const lastSession = new Date(lastSessionTimestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60));
    
    return diffMinutes < 10;
  };
  
  const sessionDelay = isSessionRecent();
  
  // Déterminer le message d'infobulle approprié
  const getTooltipMessage = () => {
    if (!isBotActive) return "Le bot d'analyse est actuellement inactif";
    if (!canStart) return "Opération non disponible pour le moment";
    if (hasReachedLimit) return `Limite de ${getSessionLimit()} session(s) quotidienne(s) atteinte`;
    if (sessionDelay) return "Veuillez attendre quelques minutes entre les sessions";
    if (disabled) return "Action en cours...";
    return "Commencer une nouvelle analyse";
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button
              onClick={onClick}
              disabled={disabled || !canStart || hasReachedLimit || sessionDelay || !isBotActive}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
              variant="default"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                  <span>Analyse en cours...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  {!canStart || hasReachedLimit || !isBotActive ? (
                    <Lock className="mr-2 h-5 w-5" />
                  ) : sessionDelay ? (
                    <Clock className="mr-2 h-5 w-5" />
                  ) : (
                    <PlayCircle className="mr-2 h-5 w-5" />
                  )}
                  <span>Nouvelle analyse</span>
                </div>
              )}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipMessage()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SessionButton;
