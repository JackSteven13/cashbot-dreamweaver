
import React, { useState } from 'react';
import SummaryPanel from './summary/SummaryPanel';
import DashboardTabs from './metrics/tabs/DashboardTabs';
import { ReferralLinkDisplay } from './referral';
import { Card } from '@/components/ui/card';
import { UserData } from '@/types/userData';

interface DashboardContentProps {
  userData: UserData | null;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void;
  isNewUser?: boolean;
  dailySessionCount: number;
  showLimitAlert: boolean;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  userData,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  isNewUser = false,
  dailySessionCount,
  showLimitAlert,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Valeurs sécurisées pour éviter les erreurs si userData est null
  const balance = userData?.balance || 0;
  const subscription = userData?.subscription || 'freemium';
  const transactions = userData?.transactions || [];
  const referrals = userData?.referrals || [];
  const referralLink = userData?.referralLink || window.location.origin + '/register?ref=user';
  const referralCount = referrals.length;
  const referralBonus = referralCount * 10; // Calcul simple des bonus

  return (
    <div className="space-y-8 pb-10">
      <SummaryPanel
        balance={balance}
        referralLink={referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        handleWithdrawal={handleWithdrawal}
        isNewUser={isNewUser}
        subscription={subscription}
        dailySessionCount={dailySessionCount}
        canStartSession={!showLimitAlert}
        referrals={referrals}
        referralCount={referralCount}
        withdrawalThreshold={200}
        lastSessionTimestamp={lastSessionTimestamp}
        isBotActive={isBotActive}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <DashboardTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            subscription={subscription}
            dailySessionCount={dailySessionCount}
            isTopReferrer={referralCount > 5}
            referralCount={referralCount}
            referralBonus={referralBonus}
            isNewUser={isNewUser}
            balance={balance}
            transactions={transactions}
            canStartSession={!showLimitAlert}
            handleStartSession={handleStartSession}
            handleWithdrawal={handleWithdrawal}
          />
        </div>
        
        <div className="space-y-6">
          <ReferralLinkDisplay 
            referralLink={referralLink} 
            referralCount={referralCount}
          />
          
          {/* Autres composants de la colonne latérale si nécessaire */}
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
