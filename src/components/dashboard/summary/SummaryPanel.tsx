
import React, { memo } from 'react';
import BalanceDisplay from './balanceDisplay/BalanceDisplay';
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
  withdrawalThreshold = 300,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main column with balance and action buttons */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="px-6 pt-6 pb-0">
            <h3 className="text-xl font-bold mb-4 text-blue-800 dark:text-blue-300 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-7a1 1 0 1 0-1-1 1 1 0 0 0 1 1zm0-4a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V10a1 1 0 0 0-1-1z"/>
              </svg>
              Votre solde
            </h3>
          </div>
          
          <BalanceDisplay 
            balance={balance} 
            currency="EUR" 
            isLoading={false} 
            subscription={subscription}
          />
          
          <div className="px-6 pt-4 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <SessionButton 
              handleStartSession={handleStartSession}
              isStartingSession={isStartingSession}
              canStartSession={canStartSession && isBotActive}
              subscription={subscription}
              dailySessionCount={dailySessionCount}
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
      
      {/* Secondary column with referral and stats */}
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 p-5">
          <ReferralSuggestion 
            referralLink={referralLink}
            referralCount={referralCount}
            withdrawalThreshold={withdrawalThreshold}
          />
        </div>
      </div>
    </div>
  );
});

SummaryPanel.displayName = 'SummaryPanel';
export default SummaryPanel;
