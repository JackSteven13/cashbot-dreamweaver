
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Clock, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { PLANS } from '@/utils/plans';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import { useAuth } from '@/hooks/useAuth';

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
  // Obtenir l'ID utilisateur actuel
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  
  // Pour les comptes freemium, vérifier strictement la limite journalière
  const [forceDisabled, setForceDisabled] = useState(false);
  const [limitExactlyReached, setLimitExactlyReached] = useState(false);
  
  // Référence pour éviter les clics rapides
  const lastClickTime = useRef<number>(0);
  const clickCooldownMs = 5000; // 5 seconds cooldown
  
  // Effet pour détecter les changements de limite
  useEffect(() => {
    // Vérification immédiate de la limite au montage
    const checkDailyLimit = () => {
      // S'assurer que balanceManager a le bon utilisateur
      if (balanceManager.getUserId && balanceManager.getUserId() !== userId) {
        balanceManager.setUserId(userId);
      }
      
      // Vérifier si la limite est atteinte
      const isLimitReached = balanceManager.isDailyLimitReached(subscription);
      if (isLimitReached) {
        setForceDisabled(true);
        setLimitExactlyReached(true);
      }
      
      // Vérifier également les drapeaux de limite de localStorage
      const limitReached = localStorage.getItem(`daily_limit_reached_${userId}`);
      if (limitReached === 'true') {
        setForceDisabled(true);
        setLimitExactlyReached(true);
      }
      
      // Pour les freemium, vérifier aussi le flag spécifique
      if (subscription === 'freemium') {
        const freemiumLimitReached = localStorage.getItem(`freemium_daily_limit_reached_${userId}`);
        if (freemiumLimitReached === 'true') {
          setForceDisabled(true);
        }
      }
    };
    
    // Vérifier au montage
    checkDailyLimit();
    
    // Vérifier aussi périodiquement
    const intervalId = setInterval(checkDailyLimit, 10000);
    
    // Écouter les événements de limite atteinte
    const handleLimitReached = () => {
      setForceDisabled(true);
      setLimitExactlyReached(true);
    };
    
    // Écouter les événements de limite enforcée
    const handleLimitEnforced = () => {
      setForceDisabled(true);
      setLimitExactlyReached(true);
    };
    
    window.addEventListener('daily-limit:reached', handleLimitReached);
    window.addEventListener('daily-limit:enforced', handleLimitEnforced);
    
    // Nettoyage
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('daily-limit:reached', handleLimitReached);
      window.removeEventListener('daily-limit:enforced', handleLimitEnforced);
    };
  }, [userId, subscription]);
  
  // RENFORCÉ: Effet pour vérifier si la limite quotidienne est atteinte
  useEffect(() => {
    const checkSessionLimits = () => {
      if (subscription === 'freemium') {
        // Utiliser des clés spécifiques à l'utilisateur
        const limitReached = localStorage.getItem(`freemium_daily_limit_reached_${userId}`);
        const dailyLimitReached = localStorage.getItem(`daily_limit_reached_${userId}`);
        const lastSessionDate = localStorage.getItem(`last_session_date_${userId}`);
        const today = new Date().toDateString();
        
        // Si c'est un nouveau jour, réinitialiser la limite
        if (lastSessionDate !== today) {
          localStorage.removeItem(`freemium_daily_limit_reached_${userId}`);
          localStorage.removeItem(`daily_limit_reached_${userId}`);
          setForceDisabled(false);
          setLimitExactlyReached(false);
        } else if (limitReached === 'true' || dailyLimitReached === 'true' || dailySessionCount >= 1) {
          // Sinon, appliquer la limite stricte pour les comptes freemium
          setForceDisabled(true);
          
          // Vérifier si c'est précisément la limite de gains qui est atteinte
          if (dailyLimitReached === 'true') {
            setLimitExactlyReached(true);
          }
        } else {
          setForceDisabled(false);
          setLimitExactlyReached(false);
        }
      }
    };
    
    // Vérifier immédiatement
    checkSessionLimits();
    
    // RENFORCÉ: Vérifier à chaque changement et périodiquement
    const intervalId = setInterval(checkSessionLimits, 2000);
    
    // RENFORCÉ: Écouter aussi les événements de limite atteinte
    const handleLimitReached = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventUserId = customEvent.detail?.userId;
      
      // Ne réagir qu'aux événements concernant cet utilisateur
      if (eventUserId === userId) {
        console.log("Event 'daily-limit:reached' détecté dans SessionButton");
        setForceDisabled(true);
        setLimitExactlyReached(true);
      }
    };
    
    window.addEventListener('daily-limit:reached', handleLimitReached as EventListener);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('daily-limit:reached', handleLimitReached as EventListener);
    };
  }, [subscription, dailySessionCount, userId]);
  
  // RENFORCÉ: S'assurer que le balanceManager utilise le bon ID
  useEffect(() => {
    if (userId && userId !== 'anonymous') {
      if (balanceManager.getUserId && balanceManager.getUserId() !== userId) {
        balanceManager.setUserId(userId);
      } else if (!balanceManager.getUserId) {
        balanceManager.setUserId(userId);
      }
    }
    
    // Vérifier la limite directement via le balanceManager
    if (userId !== 'anonymous' && subscription) {
      const isLimitReached = balanceManager.isDailyLimitReached(subscription);
      if (isLimitReached) {
        setForceDisabled(true);
        setLimitExactlyReached(true);
      }
      
      // Force une vérification globale des limites
      window.dispatchEvent(new CustomEvent('daily-limit:check-all'));
    }
  }, [userId, subscription]);
  
  // Get the max daily sessions based on subscription
  const maxDailySessions = PLANS[subscription]?.dailyLimit || 1;
  
  // Pour les comptes freemium, strictement limité à 1 session
  const isFreemium = subscription === 'freemium';
  const hasReachedLimit = isFreemium ? 
    (dailySessionCount >= 1 || forceDisabled) : 
    dailySessionCount >= maxDailySessions;

  // Check if bot is in cooldown period
  const isInCooldown = lastSessionTimestamp ? (
    new Date().getTime() - new Date(parseInt(lastSessionTimestamp)).getTime() < 5 * 60 * 1000
  ) : false;

  // RENFORCÉ: Vérifier si la limite quotidienne de gains est atteinte en temps réel
  const dailyGains = balanceManager.getDailyGains();
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  const isLimitReached = balanceManager.isDailyLimitReached ? 
    balanceManager.isDailyLimitReached(subscription) : 
    (dailyGains >= dailyLimit * 0.99); // 99% pour éviter les erreurs d'arrondi

  // RENFORCÉ: Determine button appearance and tooltip message
  const getTooltipMessage = () => {
    if (!isBotActive) return "Le système est temporairement indisponible";
    if (isLoading) return "Démarrage de la session...";
    if (isLimitReached || limitExactlyReached) {
      return `Limite de gains quotidiens atteinte (${dailyGains.toFixed(2)}€/${dailyLimit}€)`;
    }
    if (hasReachedLimit) {
      if (isFreemium) return "Limite atteinte: 1 session par jour (freemium)";
      return `Limite quotidienne atteinte (${dailySessionCount}/${maxDailySessions})`;
    }
    if (isInCooldown) return "Période de refroidissement (5 min)";
    return "Démarrer une nouvelle session d'analyse";
  };

  // RENFORCÉ: Function to handle click with strict verification
  const handleClick = () => {
    // Anti-spam protection
    const now = Date.now();
    if (now - lastClickTime.current < clickCooldownMs) {
      console.log("Button clicked too soon after last click, ignoring");
      return;
    }
    lastClickTime.current = now;
    
    // DOUBLE VÉRIFICATION EN TEMPS RÉEL
    // Vérifier à nouveau la limite au moment du clic
    const realTimeLimit = balanceManager.isDailyLimitReached(subscription);
    if (realTimeLimit) {
      console.log("Session button blocked - Limit check at click time returned true");
      setForceDisabled(true);
      setLimitExactlyReached(true);
      return;
    }
    
    // Vérification multi-niveau
    if (isFreemium && (dailySessionCount >= 1 || forceDisabled)) {
      console.log("Session button blocked - Freemium limit reached");
      return;
    }
    
    // Vérification de la limite de gains en temps réel
    const currentGains = balanceManager.getDailyGains();
    if (currentGains >= dailyLimit * 0.99) {
      console.log(`Session button blocked - Daily gain limit reached (${currentGains}€/${dailyLimit}€)`);
      return;
    }
    
    // Vérification finale que le bouton n'est pas désactivé
    if (disabled || isLoading || hasReachedLimit || isInCooldown || !isBotActive || isLimitReached || forceDisabled) {
      console.log("Session button blocked - Button is disabled");
      return;
    }
    
    console.log("Session button clicked, executing onClick handler");
    onClick();
  };

  // RENFORCÉ: Rendre le bouton plus explicite s'il est désactivé pour cause de limite
  const getButtonStyle = () => {
    if ((hasReachedLimit && isFreemium) || isLimitReached || limitExactlyReached || forceDisabled) {
      return 'w-full h-11 bg-red-600 hover:bg-red-600 text-white cursor-not-allowed';
    }
    return 'w-full h-11 bg-green-600 hover:bg-green-700 text-white';
  };

  // RENFORCÉ: Message concret pour l'utilisateur
  const getButtonLabel = () => {
    if (!isBotActive) return "Indisponible";
    if (isLimitReached || limitExactlyReached) return "Limite atteinte";
    if (isFreemium && forceDisabled) return "Limite (1/jour)";
    if (hasReachedLimit) return isFreemium ? "Limite (1/jour)" : "Limite atteinte";
    if (isInCooldown) return "En attente";
    return "Démarrer";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">
            <Button
              onClick={handleClick}
              disabled={disabled || isLoading || hasReachedLimit || isInCooldown || !isBotActive || isLimitReached || forceDisabled}
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
                  {!isBotActive || isLimitReached || limitExactlyReached || (isFreemium && forceDisabled) ? (
                    <AlertCircle className="mr-2 h-5 w-5" />
                  ) : hasReachedLimit || isInCooldown ? (
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
