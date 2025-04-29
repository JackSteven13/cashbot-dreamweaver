
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Clock } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
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
  lastSessionTimestamp,
  subscription = 'freemium',
  dailySessionCount = 0,
}) => {
  const lastClickTime = useRef<number>(0);
  const clickCooldownMs = 3000; // 3 secondes de protection anti-spam
  const [isInternalLoading, setIsInternalLoading] = useState(false);
  
  // Cooldown de 5 secondes entre sessions
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  // État interne pour désactiver temporairement le bouton
  const [isInternalDisabled, setIsInternalDisabled] = useState(() => {
    // Vérification initiale des limites
    const userId = localStorage.getItem('current_user_id');
    if (!userId) return false;
    
    // Vérifier si c'est un nouveau jour
    const lastSessionDate = localStorage.getItem('last_session_date');
    const today = new Date().toDateString();
    
    if (lastSessionDate !== today) {
      // C'est un nouveau jour, réinitialiser les limites
      localStorage.removeItem(`daily_limit_reached_${userId}`);
      localStorage.removeItem(`freemium_daily_limit_reached_${userId}`);
      return false;
    }
    
    // Vérifier les limites générales
    const limitReached = localStorage.getItem(`daily_limit_reached_${userId}`) === 'true';
    
    // Pour les comptes freemium, vérifier aussi la limite spécifique
    if (subscription === 'freemium') {
      const freemiumLimitReached = localStorage.getItem(`freemium_daily_limit_reached_${userId}`) === 'true';
      return limitReached || freemiumLimitReached || dailySessionCount >= 1;
    }
    
    return limitReached;
  });
  
  // Vérifier les limites au changement d'abonnement ou de compteur de session
  useEffect(() => {
    const checkLimitReached = () => {
      const userId = localStorage.getItem('current_user_id');
      if (!userId) return false;
      
      // Vérifier si c'est un nouveau jour
      const lastSessionDate = localStorage.getItem('last_session_date');
      const today = new Date().toDateString();
      
      if (lastSessionDate !== today) {
        // Nouveau jour, réinitialiser les limites
        localStorage.removeItem(`daily_limit_reached_${userId}`);
        localStorage.removeItem(`freemium_daily_limit_reached_${userId}`);
        balanceManager.resetDailyGains?.();
        return false;
      }
      
      // Vérifier la limite générale
      const limitReached = localStorage.getItem(`daily_limit_reached_${userId}`) === 'true';
      
      // Pour les comptes freemium
      if (subscription === 'freemium') {
        const freemiumLimitReached = localStorage.getItem(`freemium_daily_limit_reached_${userId}`) === 'true';
        return limitReached || freemiumLimitReached || dailySessionCount >= 1;
      }
      
      // Pour les autres abonnements, vérifier aussi les gains quotidiens
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const currentDailyGains = balanceManager.getDailyGains();
      
      return limitReached || currentDailyGains >= dailyLimit * 0.95;
    };
    
    const isLimited = checkLimitReached();
    setIsInternalDisabled(isLimited);
    
    // Écouter les événements de limite atteinte
    const handleLimitReached = () => {
      setIsInternalDisabled(true);
    };
    
    window.addEventListener('daily-limit:reached', handleLimitReached as EventListener);
    window.addEventListener('freemium:limit-changed', ((e: any) => {
      if (e.detail?.limited) {
        setIsInternalDisabled(true);
      }
    }) as EventListener);
    
    // Écouter les événements de session terminée
    window.addEventListener('session:completed', (() => {
      setTimeout(() => {
        const newLimitStatus = checkLimitReached();
        setIsInternalDisabled(newLimitStatus);
      }, 500);
    }) as EventListener);
    
    return () => {
      window.removeEventListener('daily-limit:reached', handleLimitReached as EventListener);
      window.removeEventListener('freemium:limit-changed', (() => {}) as EventListener);
      window.removeEventListener('session:completed', (() => {}) as EventListener);
    };
  }, [subscription, dailySessionCount]);
  
  // Gestion du cooldown
  useEffect(() => {
    if (!lastSessionTimestamp) return;
    
    const checkCooldown = () => {
      const cooldownTime = 5 * 1000; // 5 secondes
      const lastTimestamp = parseInt(lastSessionTimestamp);
      if (isNaN(lastTimestamp)) return;
      
      const timeSinceLastSession = Date.now() - lastTimestamp;
      
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

  // Message du tooltip
  const getTooltipMessage = () => {
    if (isLoading || isInternalLoading) return "Démarrage de la session...";
    if (isInCooldown) return `En attente (${cooldownRemaining}s)`;
    if (isInternalDisabled && subscription === 'freemium') return "Limite quotidienne atteinte (1/jour)";
    if (isInternalDisabled) return "Limite quotidienne atteinte";
    if (disabled) return "Sessions non disponibles actuellement";
    return "Démarrer une nouvelle session d'analyse";
  };

  const handleClick = () => {
    // Protection anti-spam
    const now = Date.now();
    if (now - lastClickTime.current < clickCooldownMs || isInternalDisabled || isInCooldown) {
      return;
    }
    
    // Désactiver le bouton immédiatement
    setIsInternalLoading(true);
    lastClickTime.current = now;
    
    // Exécuter le gestionnaire de clic
    onClick();
    
    // Enregistrer le timestamp de la session
    localStorage.setItem('lastSessionTimestamp', now.toString());
    
    // Si c'est un compte freemium, marquer comme limite atteinte
    const userId = localStorage.getItem('current_user_id');
    if (userId && subscription === 'freemium') {
      localStorage.setItem(`freemium_daily_limit_reached_${userId}`, 'true');
      localStorage.setItem('last_session_date', new Date().toDateString());
      
      // Informer les autres composants
      window.dispatchEvent(new CustomEvent('freemium:limit-changed', {
        detail: { limited: true, userId }
      }));
    }
    
    // Déclencher un événement pour informer les autres composants
    window.dispatchEvent(new CustomEvent('session:manual-start', {
      detail: { timestamp: now }
    }));
    
    // Réactiver le bouton après un délai
    setTimeout(() => {
      setIsInternalLoading(false);
      
      // Ne pas réactiver si un abonnement non-freemium et que la limite n'est pas atteinte
      if (subscription !== 'freemium') {
        const userId = localStorage.getItem('current_user_id');
        if (userId) {
          const limitReached = localStorage.getItem(`daily_limit_reached_${userId}`) === 'true';
          if (!limitReached) {
            // Vérifier aussi les gains quotidiens
            const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
            const currentDailyGains = balanceManager.getDailyGains();
            
            if (currentDailyGains < dailyLimit * 0.95) {
              setIsInternalDisabled(false);
            }
          }
        } else {
          setIsInternalDisabled(false);
        }
      } else {
        // Pour freemium, toujours désactiver après une session
        setIsInternalDisabled(true);
      }
    }, clickCooldownMs);
  };

  // Style du bouton
  const getButtonStyle = () => {
    if (isLoading || isInternalLoading) return 'w-full h-11 bg-orange-500 hover:bg-orange-600 text-white';
    if (isInCooldown) return 'w-full h-11 bg-amber-500 hover:bg-amber-600 text-white';
    if (isInternalDisabled) return 'w-full h-11 bg-gray-500 hover:bg-gray-500 text-white opacity-70';
    return 'w-full h-11 bg-green-500 hover:bg-green-600 text-white';
  };

  // Libellé du bouton
  const getButtonLabel = () => {
    if (isLoading || isInternalLoading) return "Démarrage...";
    if (isInCooldown) return `En attente (${cooldownRemaining}s)`;
    if (isInternalDisabled && subscription === 'freemium') return "Limite (1/jour)";
    if (isInternalDisabled) return "Limite atteinte";
    return "Démarrer";
  };

  // État du bouton
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
