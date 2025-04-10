
import React from 'react';
import UserBalanceCard from './userBalanceCard/UserBalanceCard';
import SessionInfo from './SessionInfo';
import { WithdrawButton } from './buttons/WithdrawButton';
import { BoostButton } from './buttons/BoostButton';
import { ReferralSuggestion } from './buttons/ReferralSuggestion';
import { getWithdrawalThreshold } from '@/utils/referral/withdrawalUtils';

interface SummaryPanelProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void;
  isNewUser?: boolean;
  subscription?: string;
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
  // Obtenir le seuil de retrait pour cet abonnement
  const withdrawalThreshold = getWithdrawalThreshold(subscription);
  
  // S'assurer que les nouveaux utilisateurs commencent toujours avec un solde à 0
  const displayBalance = isNewUser ? 0 : balance;
  const effectiveSubscription = subscription;
  const effectiveDailyLimit = 0.5; // Valeur par défaut, sera mise à jour par le hook

  return (
    <div className="grid grid-cols-1 gap-4 mb-6">
      <UserBalanceCard 
        balance={displayBalance} 
        subscription={effectiveSubscription}
        dailyLimit={effectiveDailyLimit}
        isNewUser={isNewUser}
        referralCount={referralCount}
        referralBonus={referralBonus}
        withdrawalThreshold={withdrawalThreshold}
      />
      
      <SessionInfo 
        dailySessionCount={dailySessionCount}
        lastSessionTimestamp={lastSessionTimestamp}
        isBotActive={isBotActive}
      />
      
      <div className="flex flex-col sm:flex-row gap-3">
        <BoostButton 
          isStartingSession={isStartingSession}
          canStartSession={canStartSession}
          onClick={handleStartSession}
          subscription={subscription}
        />
        
        <WithdrawButton 
          onClick={handleWithdrawal || (() => {})}
          isButtonDisabled={!handleWithdrawal}
          isWithdrawing={false}
          currentBalance={balance}
          subscription={subscription}
        />
      </div>
    </div>
  );
};

export default SummaryPanel;
