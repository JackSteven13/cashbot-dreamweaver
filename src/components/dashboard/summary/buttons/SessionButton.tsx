
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Clock, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { PLANS } from '@/utils/plans';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SessionButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  subscription?: string;
  dailySessionCount?: number;
  canStart?: boolean;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
  userId?: string;
}

const SessionButton: React.FC<SessionButtonProps> = ({
  onClick,
  isLoading = false,
  disabled = false,
  subscription = 'freemium',
  dailySessionCount = 0,
  canStart = true,
  lastSessionTimestamp,
  isBotActive = true,
  userId
}) => {
  // Pour les comptes freemium, vérifier aussi le localStorage et la base de données
  const [forceDisabled, setForceDisabled] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [lastDbCheck, setLastDbCheck] = useState(0);
  
  // Vérifier la base de données pour confirmer le nombre réel de sessions aujourd'hui
  const checkDatabaseSessionCount = async () => {
    if (!userId || isValidating || Date.now() - lastDbCheck < 5000) return;
    
    try {
      setIsValidating(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Vérifier combien de sessions ont été réellement effectuées aujourd'hui
      const { data, error } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .like('created_at', `${today}%`)
        .like('report', '%Session%');
      
      if (!error && data) {
        const actualSessionCount = data.length;
        
        // Si c'est un compte freemium avec déjà 1+ session, bloquer strictement
        if (subscription === 'freemium' && actualSessionCount >= 1) {
          console.log("DB check: Freemium limit reached", actualSessionCount);
          setForceDisabled(true);
          localStorage.setItem('freemium_daily_limit_reached', 'true');
          localStorage.setItem('last_session_date', new Date().toDateString());
          
          // Mettre à jour l'état dans le stockage local pour assurer la cohérence
          if (actualSessionCount > dailySessionCount) {
            localStorage.setItem('dailySessionCount', String(actualSessionCount));
          }
        }
      }
      
      setLastDbCheck(Date.now());
    } catch (err) {
      console.error("Error checking DB session count:", err);
    } finally {
      setIsValidating(false);
    }
  };
  
  // Effet pour vérifier si la limite quotidienne a été atteinte pour les comptes freemium
  useEffect(() => {
    const checkFreemiumLimit = () => {
      if (subscription === 'freemium') {
        // Vérifier d'abord le localStorage
        const limitReached = localStorage.getItem('freemium_daily_limit_reached');
        const lastSessionDate = localStorage.getItem('last_session_date');
        const today = new Date().toDateString();
        
        // Si c'est un nouveau jour, réinitialiser la limite
        if (lastSessionDate !== today) {
          localStorage.removeItem('freemium_daily_limit_reached');
          setForceDisabled(false);
        } else if (limitReached === 'true' || dailySessionCount >= 1) {
          // Sinon, appliquer la limite stricte pour les comptes freemium
          setForceDisabled(true);
        } else {
          setForceDisabled(false);
          // Vérifier également la base de données pour confirmer
          checkDatabaseSessionCount();
        }
      } else {
        setForceDisabled(false);
      }
    };
    
    checkFreemiumLimit();
    
    // Vérifier à chaque changement et périodiquement
    const intervalId = setInterval(() => {
      checkFreemiumLimit();
    }, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [subscription, dailySessionCount, userId]);
  
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

  // Vérifier si la limite quotidienne de gains est atteinte
  const dailyGains = balanceManager.getDailyGains();
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  const isLimitReached = dailyGains >= dailyLimit * 0.95; // 95% de la limite pour être préventif

  // Determine the tooltip message
  const getTooltipMessage = () => {
    if (!isBotActive) return "Le système est temporairement indisponible";
    if (isLoading) return "Démarrage de la session...";
    if (isLimitReached) return `Limite de gains quotidiens atteinte (${dailyGains.toFixed(2)}€/${dailyLimit}€)`;
    if (hasReachedLimit) {
      if (isFreemium) return "Limite atteinte: 1 session par jour (freemium)";
      return `Limite quotidienne atteinte (${dailySessionCount}/${maxDailySessions})`;
    }
    if (isInCooldown) return "Période de refroidissement (5 min)";
    return "Démarrer une nouvelle session d'analyse";
  };

  // Function to handle click with strict validation
  const handleClick = () => {
    // STRICT: Re-vérifier avec la base de données une dernière fois pour les comptes freemium
    if (isFreemium && userId) {
      const today = new Date().toISOString().split('T')[0];
      
      // Start by wrapping the Promise call in an async function to properly handle it
      const checkDBAndProcess = async () => {
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select('id')
            .eq('user_id', userId)
            .like('created_at', `${today}%`)
            .like('report', '%Session%');
          
          if (!error && data) {
            if (data.length >= 1) {
              // Déjà 1+ session aujourd'hui, interdire strictement
              localStorage.setItem('freemium_daily_limit_reached', 'true');
              localStorage.setItem('last_session_date', new Date().toDateString());
              setForceDisabled(true);
              
              toast({
                title: "Limite quotidienne atteinte",
                description: "Les comptes freemium sont limités à 1 session par jour.",
                variant: "destructive",
                duration: 5000
              });
              
              return;
            }
          }
          
          // Poursuivre avec le contrôle de limite normal
          performNormalCheck();
        } catch (err) {
          console.error("Error checking database:", err);
          // En cas d'erreur, appliquer le contrôle normal
          performNormalCheck();
        }
      };
      
      // Execute the async function
      checkDBAndProcess();
    } else {
      // Pour les autres abonnements, procéder normalement
      performNormalCheck();
    }
  };
  
  // La vérification normale des limites
  const performNormalCheck = () => {
    // Pour les comptes freemium, vérification STRICTE avant de permettre le clic
    if (isFreemium && (dailySessionCount >= 1 || forceDisabled)) {
      console.log("Session button blocked - Freemium limit reached");
      toast({
        title: "Limite quotidienne atteinte",
        description: "Les comptes freemium sont limités à 1 session par jour.",
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    
    // Vérification de la limite de gains
    if (isLimitReached) {
      console.log("Session button blocked - Daily gain limit reached");
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite de gain journalier de ${dailyLimit}€.`,
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    
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
              disabled={disabled || isLoading || hasReachedLimit || isInCooldown || !isBotActive || isLimitReached || forceDisabled || isValidating}
              className={`w-full h-11 ${(hasReachedLimit && isFreemium) || isLimitReached || forceDisabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
              variant="default"
              size="lg"
              data-testid="session-button"
            >
              {isLoading || isValidating ? (
                <div className="flex items-center">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  <span>{isValidating ? "Vérification..." : "Démarrage..."}</span>
                </div>
              ) : (
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
