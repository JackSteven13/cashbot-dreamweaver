
import React from 'react';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/utils/plans';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SessionButtonContent } from './session/SessionButtonContent';
import { SessionTooltip } from './session/SessionTooltip';
import { useSessionState } from './session/useSessionState';

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
  const { forceDisabled, isValidating } = useSessionState(
    userId,
    subscription,
    dailySessionCount
  );

  const maxDailySessions = PLANS[subscription]?.dailyLimit || 1;
  const isFreemium = subscription === 'freemium';
  const hasReachedLimit = isFreemium ? 
    (dailySessionCount >= 1 || forceDisabled) : 
    dailySessionCount >= maxDailySessions;

  const isInCooldown = lastSessionTimestamp ? (
    new Date().getTime() - new Date(parseInt(lastSessionTimestamp)).getTime() < 5 * 60 * 1000
  ) : false;

  const dailyGains = balanceManager.getDailyGains();
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  const isLimitReached = dailyGains >= dailyLimit * 0.95;

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

  const handleClick = async () => {
    if (isFreemium && userId) {
      const today = new Date().toISOString().split('T')[0];
      
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', userId)
          .like('created_at', `${today}%`)
          .like('report', '%Session%');
        
        if (!error && data && data.length >= 1) {
          localStorage.setItem('freemium_daily_limit_reached', 'true');
          localStorage.setItem('last_session_date', new Date().toDateString());
          
          toast({
            title: "Limite quotidienne atteinte",
            description: "Les comptes freemium sont limités à 1 session par jour.",
            variant: "destructive",
            duration: 5000
          });
          
          return;
        }
        
        performNormalCheck();
      } catch (err) {
        console.error("Error checking database:", err);
        performNormalCheck();
      }
    } else {
      performNormalCheck();
    }
  };

  const performNormalCheck = () => {
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
    <SessionTooltip tooltipMessage={getTooltipMessage()}>
      <div className="w-full">
        <Button
          onClick={handleClick}
          disabled={disabled || isLoading || hasReachedLimit || isInCooldown || !isBotActive || isLimitReached || forceDisabled || isValidating}
          className={`w-full h-11 ${(hasReachedLimit && isFreemium) || isLimitReached || forceDisabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
          variant="default"
          size="lg"
          data-testid="session-button"
        >
          <SessionButtonContent
            isLoading={isLoading}
            isValidating={isValidating}
            isBotActive={isBotActive}
            isLimitReached={isLimitReached}
            isFreemium={isFreemium}
            forceDisabled={forceDisabled}
            hasReachedLimit={hasReachedLimit}
            isInCooldown={isInCooldown}
          />
        </Button>
      </div>
    </SessionTooltip>
  );
};

export default SessionButton;
