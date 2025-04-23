
import React from 'react';
import SummaryPanel from './summary/SummaryPanel';
import TransactionsPanel from './transactions/TransactionsPanel';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

interface DashboardMetricsProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void;
  transactions: any[];
  isNewUser?: boolean;
  subscription: string;
  dailySessionCount?: number;
  canStartSession?: boolean;
  referrals?: any[];
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  balance,
  referralLink,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  transactions,
  isNewUser = false,
  subscription,
  dailySessionCount = 0,
  canStartSession = true,
  referrals = [],
  lastSessionTimestamp,
  isBotActive = true
}) => {
  // STRICT: les nouveaux utilisateurs ont TOUJOURS un solde à 0
  const displayBalance = isNewUser ? 0 : balance;
  
  console.log(`DashboardMetrics: isNewUser=${isNewUser}, balance=${balance}, displayBalance=${displayBalance}`);
  
  // Pour les comptes freemium, limiter l'affichage du solde à la limite quotidienne
  const adjustedBalance = isNewUser 
    ? 0 
    : (subscription === 'freemium' 
        ? Math.min(displayBalance, 20) // Limiter à 20€ maximum pour freemium
        : displayBalance);
  
  // Calculer les gains issus des parrainages
  const referralBonus = isNewUser ? 0 : (referrals?.reduce((total, ref) => total + (ref.commission_earned || 0), 0) || 0);
  
  // Compter le nombre de parrainages actifs
  const activeReferralCount = isNewUser ? 0 : (referrals?.filter(ref => ref.active !== false)?.length || 0);
  
  return (
    <div className="dashboard-metrics space-y-6">
      <SummaryPanel
        balance={adjustedBalance}
        referralLink={referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        handleWithdrawal={handleWithdrawal}
        isNewUser={isNewUser}
        subscription={subscription}
        dailySessionCount={dailySessionCount}
        canStartSession={canStartSession}
        referrals={referrals}
        referralCount={activeReferralCount}
        withdrawalThreshold={200}
        lastSessionTimestamp={lastSessionTimestamp}
        isBotActive={isBotActive}
      />
      
      <TransactionsPanel
        transactions={transactions}
        isLoading={transactions.length === 0}
        isNewUser={isNewUser}
      />
    </div>
  );
};

export default DashboardMetrics;
