
import React, { useState, useEffect } from 'react';
import { FeedbackDialog } from './FeedbackDialog';
import { SystemInfo, SystemInfoGrid } from './SystemInfo';
import { ProTrialBanner, ProTrialActive } from './ProTrialBanner';
import { SystemProgressBar } from './SystemProgressBar';
import { SessionCountdown } from './SessionCountdown';
import { NewUserGuide } from './NewUserGuide';
import { useSessionCountdown } from '@/hooks/useSessionCountdown';
import { supabase } from '@/integrations/supabase/client';
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
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showProTrialInfo, setShowProTrialInfo] = useState(isNewUser);
  const [isPromoActivated, setIsPromoActivated] = useState(false);
  const [tempProEnabled, setTempProEnabled] = useState(false);
  const [effectiveSubscription, setEffectiveSubscription] = useState(subscription);
  const [effectiveLimit, setEffectiveLimit] = useState(dailyLimit);
  
  const { timeRemaining, isCountingDown } = useSessionCountdown(
    typeof remainingSessions === 'number' ? 1 - remainingSessions : 0, 
    subscription
  );
  
  const limitPercentage = Math.min(100, (displayBalance / effectiveLimit) * 100);
  
  useEffect(() => {
    const effectiveSub = getEffectiveSubscription(subscription);
    setEffectiveSubscription(effectiveSub);
    
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    setEffectiveLimit(limit);
    
    const proTrialActive = localStorage.getItem('proTrialActive') === 'true';
    const proTrialExpires = localStorage.getItem('proTrialExpires');
    
    if (proTrialActive && proTrialExpires) {
      const expiryTime = parseInt(proTrialExpires, 10);
      const now = Date.now();
      
      if (now < expiryTime) {
        setTempProEnabled(true);
        setIsPromoActivated(true);
      } else {
        localStorage.setItem('proTrialUsed', 'true');
        localStorage.removeItem('proTrialActive');
        localStorage.removeItem('proTrialExpires');
        localStorage.removeItem('proTrialActivatedAt');
      }
    }
  }, [subscription]);
  
  const activateProTrial = async () => {
    if (subscription === 'freemium' && !isPromoActivated) {
      try {
        const now = Date.now();
        
        const expiryTime = now + (48 * 60 * 60 * 1000);
        
        console.log(`Activation de l'essai Pro: ${new Date(now).toLocaleString()} jusqu'à ${new Date(expiryTime).toLocaleString()}`);
        
        localStorage.setItem('proTrialActive', 'true');
        localStorage.setItem('proTrialExpires', expiryTime.toString());
        localStorage.setItem('proTrialActivatedAt', now.toString());
        localStorage.setItem('proTrialUsed', 'true');
        
        setTempProEnabled(true);
        setIsPromoActivated(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem('tempProDisplay', 'true');
        }
        
        window.location.reload();
      } catch (error) {
        console.error("Erreur lors de l'activation de l'essai Pro:", error);
      }
    }
  };

  return (
    <div className="w-full lg:w-1/2">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg border border-slate-700 p-5 text-white">
        <SystemInfo 
          isNewUser={isNewUser} 
          onFeedbackClick={() => setShowFeedbackDialog(true)} 
        />
        
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
        
        {subscription === 'freemium' && !isPromoActivated && (
          <ProTrialBanner onClick={activateProTrial} />
        )}
        
        {isPromoActivated && <ProTrialActive />}
      </div>
      
      <FeedbackDialog
        open={showFeedbackDialog}
        feedback={feedback}
        setFeedback={setFeedback}
        onClose={() => setShowFeedbackDialog(false)}
        onSubmit={() => {
          if (feedback.trim()) {
            setFeedback('');
            setShowFeedbackDialog(false);
          }
        }}
      />
    </div>
  );
};

export default SystemTerminal;
