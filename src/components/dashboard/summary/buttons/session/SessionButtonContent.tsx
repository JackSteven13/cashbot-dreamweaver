
import React from 'react';
import { AlertCircle, Clock, PlayCircle } from 'lucide-react';

interface SessionButtonContentProps {
  isLoading: boolean;
  isValidating: boolean;
  isBotActive: boolean;
  isLimitReached: boolean;
  isFreemium: boolean;
  forceDisabled: boolean;
  hasReachedLimit: boolean;
  isInCooldown: boolean;
}

export const SessionButtonContent: React.FC<SessionButtonContentProps> = ({
  isLoading,
  isValidating,
  isBotActive,
  isLimitReached,
  isFreemium,
  forceDisabled,
  hasReachedLimit,
  isInCooldown
}) => {
  if (isLoading || isValidating) {
    return (
      <div className="flex items-center">
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
        <span>{isValidating ? "Vérification..." : "Démarrage..."}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {!isBotActive || isLimitReached || (isFreemium && forceDisabled) ? (
        <AlertCircle className="mr-2 h-5 w-5" />
      ) : hasReachedLimit || isInCooldown ? (
        <Clock className="mr-2 h-5 w-5" />
      ) : (
        <PlayCircle className="mr-2 h-5 w-5" />
      )}
      <span>
        {!isBotActive ? "Indisponible" : 
         isLimitReached ? "Limite atteinte" :
         (isFreemium && forceDisabled) ? "Limite (1/jour)" :
         hasReachedLimit ? (isFreemium ? "Limite (1/jour)" : "Limite atteinte") : 
         isInCooldown ? "En attente" : "Démarrer"}
      </span>
    </div>
  );
};
