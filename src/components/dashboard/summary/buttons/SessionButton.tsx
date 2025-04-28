
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Clock } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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
  lastSessionTimestamp
}) => {
  // Référence pour éviter les clics rapides
  const lastClickTime = useRef<number>(0);
  const clickCooldownMs = 1000; // 1 second cooldown
  
  // Check if bot is in cooldown period (RÉDUIT à 5 secondes)
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  // Gestion du cooldown
  useEffect(() => {
    if (!lastSessionTimestamp) return;
    
    const checkCooldown = () => {
      const cooldownTime = 5 * 1000; // 5 secondes
      const timeSinceLastSession = Date.now() - parseInt(lastSessionTimestamp);
      
      if (timeSinceLastSession < cooldownTime) {
        setIsInCooldown(true);
        setCooldownRemaining(Math.ceil((cooldownTime - timeSinceLastSession) / 1000));
      } else {
        setIsInCooldown(false);
        setCooldownRemaining(0);
      }
    };
    
    // Vérifier immédiatement
    checkCooldown();
    
    // Puis vérifier toutes les secondes
    const intervalId = setInterval(checkCooldown, 1000);
    
    return () => clearInterval(intervalId);
  }, [lastSessionTimestamp]);

  // Determine button appearance and tooltip message
  const getTooltipMessage = () => {
    if (isLoading) return "Démarrage de la session...";
    if (isInCooldown) return `En attente (${cooldownRemaining}s)`;
    return "Démarrer une nouvelle session d'analyse";
  };

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

  // Style du bouton amélioré
  const getButtonStyle = () => {
    if (isLoading) return 'w-full h-11 bg-orange-500 hover:bg-orange-600 text-white';
    if (isInCooldown) return 'w-full h-11 bg-amber-500 hover:bg-amber-600 text-white';
    return 'w-full h-11 bg-green-500 hover:bg-green-600 text-white';
  };

  // Message concret pour l'utilisateur
  const getButtonLabel = () => {
    if (isLoading) return "Démarrage...";
    if (isInCooldown) return `En attente (${cooldownRemaining}s)`;
    return "Démarrer";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">
            <Button
              onClick={handleClick}
              disabled={isLoading} // Seulement désactivé pendant le chargement
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
                  {isInCooldown ? (
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
