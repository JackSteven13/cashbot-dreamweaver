
import React, { useState, useEffect } from 'react';
import { SystemInfoGrid } from './SystemInfo';
import { SystemProgressBar } from './SystemProgressBar';
import { SessionCountdown } from './SessionCountdown';
import { NewUserGuide } from './NewUserGuide';
import { FeedbackManager } from './FeedbackManager';
import { ProTrialManager } from './ProTrialManager';
import { useSessionCountdown } from '@/hooks/useSessionCountdown';
import { useProTrial } from '@/hooks/useProTrial';
import { getEffectiveSubscription, SUBSCRIPTION_LIMITS } from '@/utils/subscriptionUtils';

interface SystemTerminalProps {
  isNewUser: boolean;
  dailyLimit: number;
  subscription: string;
  remainingSessions: number | string;
  referralCount: number;
  displayBalance: number;
  referralBonus?: number;
}

const SystemTerminal: React.FC<SystemTerminalProps> = ({
  isNewUser,
  dailyLimit,
  subscription,
  remainingSessions,
  referralCount,
  displayBalance,
  referralBonus = 0
}) => {
  const [showProTrialInfo, setShowProTrialInfo] = useState(isNewUser);
  const [effectiveSubscription, setEffectiveSubscription] = useState(subscription);
  const [effectiveLimit, setEffectiveLimit] = useState(dailyLimit);
  
  const { timeRemaining, isCountingDown } = useSessionCountdown(
    typeof remainingSessions === 'number' ? 1 - remainingSessions : 0, 
    subscription
  );
  
  const { isPromoActivated, tempProEnabled, activateProTrial } = useProTrial(subscription);
  
  const limitPercentage = Math.min(100, (displayBalance / effectiveLimit) * 100);
  
  useEffect(() => {
    const effectiveSub = getEffectiveSubscription(subscription);
    setEffectiveSubscription(effectiveSub);
    
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    setEffectiveLimit(limit);
  }, [subscription]);

  const handleActivateProTrial = () => {
    activateProTrial(subscription);
  };

  return (
    <div className="w-full lg:w-1/2">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg border border-slate-700 p-5 text-white">
        <FeedbackManager isNewUser={isNewUser} />
        
        <SystemProgressBar 
          displayBalance={displayBalance} 
          dailyLimit={effectiveLimit} 
          limitPercentage={limitPercentage}
          subscription={subscription}
        />
        
        {isCountingDown && (
          <SessionCountdown timeRemaining={timeRemaining} />
        )}
        
        <SystemInfoGrid 
          subscription={subscription}
          tempProEnabled={tempProEnabled}
          dailyLimit={effectiveLimit}
          remainingSessions={remainingSessions}
          referralBonus={referralBonus}
        />
        
        {isNewUser && <NewUserGuide />}
        
        <ProTrialManager 
          subscription={subscription}
          isPromoActivated={isPromoActivated}
          activateProTrial={handleActivateProTrial}
        />
      </div>
    </div>
  );
};

export default SystemTerminal;
