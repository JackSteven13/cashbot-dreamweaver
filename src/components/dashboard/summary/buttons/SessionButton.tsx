
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Clock, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { PLANS } from '@/utils/plans';
import balanceManager from '@/utils/balance/balanceManager';

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
  // Référence pour éviter les clics rapides
  const lastClickTime = useRef<number>(0);
  const clickCooldownMs = 1000; // 1 second cooldown
  
  // Get the max daily sessions based on subscription
  const maxDailySessions = PLANS[subscription]?.dailyLimit || 1;
  
  // Pour les comptes freemium, limité à 1 session
  const isFreemium = subscription === 'freemium';
  const hasReachedLimit = isFreemium ? dailySessionCount >= 1 : dailySessionCount >= maxDailySessions;

  // Check if bot is in cooldown period (RÉDUIT à 30 secondes pour faciliter les tests)
  const isInCooldown = lastSessionTimestamp ? (
    new Date().getTime() - new Date(parseInt(lastSessionTimestamp)).getTime() < 30 * 1000
  ) : false;

  // Determine button appearance and tooltip message
  const getTooltipMessage = () => {
    if (!isBotActive) return "Le système est temporairement indisponible";
    if (isLoading) return "Démarrage de la session...";
    if (hasReachedLimit) {
      if (isFreemium) return "Limite conseillée: 1 session par jour (freemium)";
      return `Limite quotidienne conseillée (${dailySessionCount}/${maxDailySessions})`;
    }
    if (isInCooldown) return "Période de refroidissement (30 secondes)";
    return "Démarrer une nouvelle session d'analyse";
  };

  // RÉPARÉ: Ne pas bloquer le clic même si les limites sont atteintes
  const handleClick = () => {
    // Anti-spam protection avec délai réduit
    const now = Date.now();
    if (now - lastClickTime.current < clickCooldownMs) {
      console.log("Button clicked too soon after last click, ignoring");
      return;
    }
    lastClickTime.current = now;
    
    // Toujours exécuter le gestionnaire de clic
    onClick();
  };

  // RENFORCÉ: Rendre le bouton plus explicite s'il est désactivé pour cause de limite
  const getButtonStyle = () => {
    if (isLoading) return 'w-full h-11 bg-orange-600 hover:bg-orange-700 text-white';
    if (!isBotActive) return 'w-full h-11 bg-gray-600 hover:bg-gray-700 text-white';
    return 'w-full h-11 bg-green-600 hover:bg-green-700 text-white';
  };

  // Message concret pour l'utilisateur
  const getButtonLabel = () => {
    if (!isBotActive) return "Indisponible";
    if (isInCooldown) return "En attente";
    if (isLoading) return "Démarrage...";
    return "Démarrer";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">
            <Button
              onClick={handleClick}
              disabled={isLoading}
              className={getButtonStyle()}
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
                  ) : isInCooldown ? (
                    <Clock className="mr-2 h-5 w-5" />
                  ) : (
                    <PlayCircle className="mr-2 h-5 w-5" />
                  )}
                  <span>{getButtonLabel()}</span>
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
