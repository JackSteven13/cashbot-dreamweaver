
import React, { memo } from 'react';
import BalanceDisplay from '@/components/dashboard/balance/BalanceDisplay';
import SessionButton from './buttons/SessionButton';
import WithdrawalButton from './buttons/WithdrawalButton';
import ReferralButton from './buttons/ReferralButton';
import InfoPanel from './InfoPanel';
import { ReferralSuggestion } from './buttons/ReferralSuggestion';

interface SummaryPanelProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void;
  isNewUser?: boolean;
  subscription?: string;
  dailySessionCount: number;
  canStartSession?: boolean;
  referrals?: any[];
  referralCount?: number;
  withdrawalThreshold?: number;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const SummaryPanel: React.FC<SummaryPanelProps> = memo(({ 
  balance, 
  referralLink,
  isStartingSession, 
  handleStartSession, 
  handleWithdrawal,
  isNewUser = false,
  subscription = 'freemium',
  dailySessionCount = 0,
  canStartSession = true,
  referrals = [],
  referralCount = 0,
  withdrawalThreshold = 200,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne principale avec solde et boutons d'action */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 pt-6 pb-0">
            <h3 className="text-xl font-semibold mb-4 dark:text-white">Votre solde</h3>
          </div>
          
          <BalanceDisplay 
            balance={balance} 
            currency="EUR" 
            isLoading={false} 
            subscription={subscription}
          />
          
          <div className="px-6 pt-4 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <SessionButton 
              onClick={handleStartSession}
              isLoading={isStartingSession}
              disabled={!canStartSession || !isBotActive || isStartingSession}
              subscription={subscription}
              dailySessionCount={dailySessionCount}
              canStart={canStartSession && isBotActive}
              lastSessionTimestamp={lastSessionTimestamp}
              isBotActive={isBotActive}
            />
            
            <WithdrawalButton
              onClick={handleWithdrawal}
              balance={balance}
              withdrawalThreshold={withdrawalThreshold}
              isPending={false}
              subscription={subscription}
            />
            
            <ReferralButton 
              referralLink={referralLink}
            />
          </div>
        </div>
        
        <InfoPanel 
          isNewUser={isNewUser} 
          subscription={subscription}
          dailySessionCount={dailySessionCount}
          lastSessionTimestamp={lastSessionTimestamp}
        />
      </div>
      
      {/* Colonne secondaire avec parrainage et statistiques */}
      <div className="space-y-6">
        <ReferralSuggestion 
          referralLink={referralLink}
          referralCount={referralCount}
          withdrawalThreshold={withdrawalThreshold}
        />
      </div>
    </div>
  );
});

SummaryPanel.displayName = 'SummaryPanel';
export default SummaryPanel;
