
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
  // Référence pour éviter les doubles clics
  const lastClickTime = useRef<number>(0);
  const clickCooldownMs = 3000; // 3 seconds cooldown (increased from 1 second)
  const [isInternalLoading, setIsInternalLoading] = useState(false);
  
  // Check if bot is in cooldown period (5 secondes)
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  // État interne pour désactiver temporairement le bouton
  const [isInternalDisabled, setIsInternalDisabled] = useState(false);
  
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
    if (isLoading || isInternalLoading) return "Démarrage de la session...";
    if (isInCooldown) return `En attente (${cooldownRemaining}s)`;
    if (isInternalDisabled) return "Session déjà en cours";
    if (disabled) return "Sessions non disponibles actuellement";
    return "Démarrer une nouvelle session d'analyse";
  };

  const handleClick = () => {
    // Anti-spam protection avec délai augmenté
    const now = Date.now();
    if (now - lastClickTime.current < clickCooldownMs || isInternalDisabled) {
      console.log("Button clicked too soon after last click or internally disabled, ignoring");
      return;
    }
    
    // Désactiver le bouton immédiatement pour éviter les clics multiples
    setIsInternalDisabled(true);
    setIsInternalLoading(true);
    lastClickTime.current = now;
    
    // Exécuter le gestionnaire de clic
    onClick();
    
    // Réactiver le bouton après un délai
    setTimeout(() => {
      setIsInternalLoading(false);
      setIsInternalDisabled(false);
    }, 3000); // 3 secondes minimum avant de pouvoir cliquer à nouveau
  };

  // Style du bouton amélioré
  const getButtonStyle = () => {
    if (isLoading || isInternalLoading) return 'w-full h-11 bg-orange-500 hover:bg-orange-600 text-white';
    if (isInCooldown) return 'w-full h-11 bg-amber-500 hover:bg-amber-600 text-white';
    if (isInternalDisabled) return 'w-full h-11 bg-gray-500 hover:bg-gray-500 text-white opacity-70';
    return 'w-full h-11 bg-green-500 hover:bg-green-600 text-white';
  };

  // Message concret pour l'utilisateur
  const getButtonLabel = () => {
    if (isLoading || isInternalLoading) return "Démarrage...";
    if (isInCooldown) return `En attente (${cooldownRemaining}s)`;
    if (isInternalDisabled) return "Traitement...";
    return "Démarrer";
  };

  // Déterminer si le bouton doit être désactivé
  const isButtonDisabled = disabled || isLoading || isInternalLoading || isInCooldown || isInternalDisabled;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">
            <Button
              onClick={handleClick}
              disabled={isButtonDisabled}
              className={getButtonStyle()}
              variant="default"
              size="lg"
              data-testid="session-button"
            >
              {(isLoading || isInternalLoading) ? (
                <div className="flex items-center">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  <span>Démarrage...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  {isInCooldown || isInternalDisabled ? (
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
