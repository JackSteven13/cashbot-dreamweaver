
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import UserBalanceCard from './userBalanceCard/UserBalanceCard';
import ActionButtons from './ActionButtons';
import WelcomeMessage from './WelcomeMessage';
import ReferralCard from './ReferralCard';
import { useSummaryPanel } from '@/hooks/useSummaryPanel';
import { toast } from '@/components/ui/use-toast';
import { getWithdrawalThreshold } from '@/utils/referral/withdrawalUtils';

interface SummaryPanelProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void;
  transactions?: any[];
  isNewUser?: boolean;
  subscription: string;
  dailySessionCount?: number;
  canStartSession?: boolean;
  referralCount?: number;
  referralBonus?: number;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({
  balance,
  referralLink,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  isNewUser = false,
  subscription = 'freemium',
  dailySessionCount = 0,
  canStartSession = true,
  referralCount = 0,
  referralBonus = 0,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  const {
    displayBalance,
    isButtonDisabled,
    isWithdrawing,
    effectiveSubscription,
    effectiveDailyLimit,
    onWithdraw,
    onBoostClick,
    calculateRemainingSessions,
    getCurrentlyCanStartSession
  } = useSummaryPanel({
    balance,
    subscription,
    handleWithdrawal,
    handleStartSession,
    referralCount
  });
  
  // Calculate whether the user can start a session right now
  const remainingSessions = calculateRemainingSessions(subscription, dailySessionCount);
  const currentlyCanStartSession = getCurrentlyCanStartSession(canStartSession);
  
  // Get the withdrawal threshold based on subscription
  const withdrawalThreshold = getWithdrawalThreshold(subscription);

  const handleShareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Mon lien de parrainage Stream Genius',
        text: 'Rejoins Stream Genius et gagne de l\'argent avec l\'analyse publicitaire! Utilise mon lien de parrainage:',
        url: referralLink
      }).catch(() => {
        navigator.clipboard.writeText(referralLink);
        toast({
          title: "Lien copié !",
          description: "Votre lien de parrainage a été copié dans le presse-papier",
        });
      });
    } else {
      navigator.clipboard.writeText(referralLink);
      toast({
        title: "Lien copié !",
        description: "Votre lien de parrainage a été copié dans le presse-papier",
      });
    }
  };

  return (
    <div className="mb-6">
      <WelcomeMessage isNewUser={isNewUser} />
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-md border-slate-200/30 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
          <CardContent className="p-5">
            <UserBalanceCard
              displayBalance={displayBalance}
              subscription={effectiveSubscription}
              dailyLimit={effectiveDailyLimit}
              referralCount={referralCount}
              referralBonus={referralBonus}
              limitPercentage={0}
              botActive={isBotActive}
              withdrawalThreshold={withdrawalThreshold}
            />
            
            <ActionButtons
              isStartingSession={isStartingSession}
              isButtonDisabled={isButtonDisabled}
              isWithdrawing={isWithdrawing}
              subscription={subscription}
              effectiveSubscription={effectiveSubscription}
              dailyLimit={effectiveDailyLimit}
              canStartSession={currentlyCanStartSession}
              onBoostClick={() => onBoostClick(canStartSession)}
              onWithdraw={onWithdraw}
              remainingSessions={remainingSessions}
              lastSessionTimestamp={lastSessionTimestamp}
              currentBalance={displayBalance}
              isBotActive={isBotActive}
              onShareReferral={handleShareReferral}
            />
          </CardContent>
        </Card>
        
        <ReferralCard 
          referralLink={referralLink} 
          referralCount={referralCount}
        />
      </div>
    </div>
  );
};

export default SummaryPanel;
