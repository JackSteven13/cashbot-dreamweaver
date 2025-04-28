
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
  lastSessionTimestamp,
  subscription = 'freemium',
  dailySessionCount = 0,
}) => {
  // Référence pour éviter les doubles clics
  const lastClickTime = useRef<number>(0);
  const clickCooldownMs = 3000; // 3 seconds cooldown
  const [isInternalLoading, setIsInternalLoading] = useState(false);
  
  // Check if bot is in cooldown period (5 secondes)
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  // État interne pour désactiver temporairement le bouton
  const [isInternalDisabled, setIsInternalDisabled] = useState(false);
  
  // Vérifier si nous avons déjà atteint la limite quotidienne en un seul appel
  useEffect(() => {
    const checkLimitReached = () => {
      const userId = localStorage.getItem('current_user_id');
      if (!userId) return false;
      
      // Vérifier si la limite est atteinte pour l'utilisateur
      const limitReached = localStorage.getItem(`daily_limit_reached_${userId}`) === 'true';
      const userSubscription = localStorage.getItem(`subscription_${userId}`) || subscription;
      
      // Pour les comptes freemium, vérifier aussi la limite de session
      if (userSubscription === 'freemium') {
        const freemiumLimitReached = localStorage.getItem(`freemium_daily_limit_reached_${userId}`) === 'true';
        console.log(`Vérification de la limite freemium: ${freemiumLimitReached}, compteur de session: ${dailySessionCount}`);
        return limitReached || freemiumLimitReached || dailySessionCount >= 1;
      }
      
      return limitReached;
    };
    
    const isLimited = checkLimitReached();
    console.log("Bouton désactivé en raison de la limite ?", isLimited);
    setIsInternalDisabled(isLimited);
    
    // Écouter les événements de limite atteinte
    const handleLimitReached = () => {
      console.log("Événement de limite atteinte reçu, désactivation du bouton");
      setIsInternalDisabled(true);
    };
    
    window.addEventListener('daily-limit:reached', handleLimitReached as EventListener);
    window.addEventListener('freemium:limit-changed', (e: any) => {
      if (e.detail?.limited) {
        setIsInternalDisabled(true);
      }
    });
    
    // Écouter les événements de fin de session
    window.addEventListener('session:completed', () => {
      if (subscription === 'freemium') {
        console.log("Session terminée, vérification des limites freemium");
        setTimeout(() => {
          const newLimitStatus = checkLimitReached();
          setIsInternalDisabled(newLimitStatus);
        }, 500);
      }
    });
    
    return () => {
      window.removeEventListener('daily-limit:reached', handleLimitReached as EventListener);
      window.removeEventListener('freemium:limit-changed', (e: any) => {});
      window.removeEventListener('session:completed', () => {});
    };
  }, [subscription, dailySessionCount]);
  
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
    if (isInternalDisabled && subscription === 'freemium') return "Limite quotidienne atteinte (1/jour)";
    if (isInternalDisabled) return "Limite quotidienne atteinte";
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
    
    // Enregistrer le timestamp de la session pour le cooldown
    localStorage.setItem('lastSessionTimestamp', now.toString());
    
    // Si c'est un compte freemium, marquer comme limite atteinte immédiatement
    const userId = localStorage.getItem('current_user_id');
    if (userId && subscription === 'freemium') {
      console.log("Marquer la limite freemium comme atteinte après le clic");
      localStorage.setItem(`freemium_daily_limit_reached_${userId}`, 'true');
      localStorage.setItem('last_session_date', new Date().toDateString());
    }
    
    // Déclencher un événement pour que d'autres composants soient informés
    window.dispatchEvent(new CustomEvent('session:manual-start', {
      detail: { timestamp: now }
    }));
    
    // Réactiver le bouton après un délai
    setTimeout(() => {
      setIsInternalLoading(false);
      
      // Ne pas réactiver si la limite est atteinte
      if (subscription !== 'freemium') {
        const userId = localStorage.getItem('current_user_id');
        if (userId) {
          const limitReached = localStorage.getItem(`daily_limit_reached_${userId}`) === 'true';
          if (!limitReached) {
            setIsInternalDisabled(false);
          }
        } else {
          setIsInternalDisabled(false);
        }
      }
    }, clickCooldownMs); // 3 secondes minimum avant de pouvoir cliquer à nouveau
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
    if (isInternalDisabled && subscription === 'freemium') return "Limite (1/jour)";
    if (isInternalDisabled) return "Limite atteinte";
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
