import React, { useState, useEffect } from 'react';
import { SystemInfoGrid } from './SystemInfo';
import { SystemProgressBar } from './SystemProgressBar';
import { SessionCountdown } from './SessionCountdown';
import { NewUserGuide } from './NewUserGuide';
import { FeedbackManager } from './FeedbackManager';
import { ProTrialManager } from './ProTrialManager';
import { TerminalDisplay } from './TerminalDisplay';
import { SystemIndicators } from './SystemIndicators';
import { useSessionCountdown } from '@/hooks/useSessionCountdown';
import { useProTrial } from '@/hooks/useProTrial';
import { useTerminalAnalysis } from '@/hooks/useTerminalAnalysis';
import { getEffectiveSubscription, SUBSCRIPTION_LIMITS } from '@/utils/subscription/subscriptionStatus';

interface SystemTerminalProps {
  isNewUser: boolean;
  dailyLimit: number;
  subscription: string;
  remainingSessions: number | string;
  referralCount: number;
  displayBalance: number;
  referralBonus?: number;
  lastSessionTimestamp?: string;
}

const SystemTerminal: React.FC<SystemTerminalProps> = ({
  isNewUser,
  dailyLimit,
  subscription,
  remainingSessions,
  referralCount,
  displayBalance,
  referralBonus = 0,
  lastSessionTimestamp
}) => {
  const [showProTrialInfo, setShowProTrialInfo] = useState(isNewUser);
  const [effectiveSubscription, setEffectiveSubscription] = useState(subscription);
  const [effectiveLimit, setEffectiveLimit] = useState(dailyLimit);
  
  const { timeRemaining, isCountingDown } = useSessionCountdown(
    typeof remainingSessions === 'number' ? 1 - remainingSessions : 0, 
    subscription,
    lastSessionTimestamp
  );
  
  const { isPromoActivated, tempProEnabled, activateProTrial } = useProTrial(subscription);
  
  const {
    showAnalysis,
    terminalLines,
    analysisComplete
  } = useTerminalAnalysis();
  
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
      <div className="bg-gradient-to-br from-[#1A1F2C] to-[#1e3a5f] rounded-xl shadow-lg border border-[#2d5f8a]/30 p-5 text-white">
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
        
        <TerminalDisplay 
          showAnalysis={showAnalysis}
          terminalLines={terminalLines}
          analysisComplete={analysisComplete}
        />
        
        {!showAnalysis && (
          <>
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
          </>
        )}
        
        <SystemIndicators showAnalysis={showAnalysis} />
      </div>
    </div>
  );
};

export default SystemTerminal;
