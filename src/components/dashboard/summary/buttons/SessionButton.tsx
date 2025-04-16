
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Clock, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { PLANS } from '@/utils/plans';

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
  // Get the max daily sessions based on subscription
  const maxDailySessions = PLANS[subscription]?.dailyLimit || 1;
  const hasReachedLimit = dailySessionCount >= maxDailySessions;

  // Check if bot is in cooldown period
  const isInCooldown = lastSessionTimestamp ? (
    new Date().getTime() - new Date(lastSessionTimestamp).getTime() < 5 * 60 * 1000
  ) : false;

  // Determine the tooltip message
  const getTooltipMessage = () => {
    if (!isBotActive) return "Le système est temporairement indisponible";
    if (isLoading) return "Démarrage de la session...";
    if (hasReachedLimit) return `Limite quotidienne atteinte (${dailySessionCount}/${maxDailySessions})`;
    if (isInCooldown) return "Période de refroidissement (5 min)";
    return "Démarrer une nouvelle session d'analyse";
  };

  // Function to handle click with console log for debugging
  const handleClick = () => {
    console.log("Session button clicked, executing onClick handler");
    onClick();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">
            <Button
              onClick={handleClick}
              disabled={disabled || isLoading || hasReachedLimit || isInCooldown || !isBotActive}
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white"
              variant="default"
              size="lg"
              data-testid="session-button"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  <span>Démarrage...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  {!isBotActive ? (
                    <AlertCircle className="mr-2 h-5 w-5" />
                  ) : hasReachedLimit || isInCooldown ? (
                    <Clock className="mr-2 h-5 w-5" />
                  ) : (
                    <PlayCircle className="mr-2 h-5 w-5" />
                  )}
                  <span>
                    {!isBotActive ? "Indisponible" : 
                     (hasReachedLimit ? "Limite atteinte" : 
                      (isInCooldown ? "En attente" : "Démarrer"))}
                  </span>
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
