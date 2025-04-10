
import React from 'react';
import UserBalanceCard from './userBalanceCard/UserBalanceCard';
import SessionInfo from './SessionInfo';
import { WithdrawButton } from './buttons/WithdrawButton';
import { BoostButton } from './buttons/BoostButton';
import { ReferralSuggestion } from './buttons/ReferralSuggestion';
import { getWithdrawalThreshold } from '@/utils/referral/withdrawalUtils';
import { useLimitChecking } from '@/hooks/sessions/manual/useLimitChecking';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';

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
  transactions?: any[];
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
  isBotActive = true,
  transactions = []
}) => {
  // Obtenir le seuil de retrait pour cet abonnement
  const withdrawalThreshold = getWithdrawalThreshold(subscription);
  const { checkNearLimit } = useLimitChecking();
  
  // Calculer la limite quotidienne
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calculer les gains d'aujourd'hui
  const today = new Date().toISOString().split('T')[0];
  const todaysTransactions = transactions?.filter(tx => tx.date?.startsWith(today) && tx.gain > 0) || [];
  const todaysGains = todaysTransactions.reduce((sum, tx) => sum + tx.gain, 0);
  
  // Calculer le pourcentage de limite
  const limitPercentage = Math.min(100, (todaysGains / dailyLimit) * 100);
  
  // Déterminer si la limite est atteinte
  const isLimitReached = todaysGains >= dailyLimit;
  
  // S'assurer que les nouveaux utilisateurs commencent toujours avec un solde à 0
  const displayBalance = isNewUser ? 0 : balance;

  return (
    <div className="grid grid-cols-1 gap-4 mb-6">
      <UserBalanceCard 
        balance={displayBalance} 
        subscription={subscription}
        dailyLimit={dailyLimit}
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
          canStartSession={canStartSession && !isLimitReached}
          onClick={handleStartSession}
          subscription={subscription}
          limitReached={isLimitReached}
          limitPercentage={limitPercentage}
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
