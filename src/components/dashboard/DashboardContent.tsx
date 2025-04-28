
import React, { useState } from 'react';
import SummaryPanel from './summary/SummaryPanel';
import DashboardTabs from './metrics/tabs/DashboardTabs';
import { ReferralLinkDisplay } from './referral';
import { Card } from '@/components/ui/card';
import { UserData, Transaction, Referral } from '@/types/userData';
import { getWithdrawalThreshold } from '@/utils/referral/withdrawalUtils';
import { TrendingUp } from 'lucide-react';

export interface DashboardContentProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void;
  isNewUser?: boolean;
  subscription: string;
  dailySessionCount: number;
  showLimitAlert: boolean;
  transactions: Transaction[];
  referrals: Referral[];
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
  selectedNavItem: string;
  setSelectedNavItem: React.Dispatch<React.SetStateAction<string>>;
  username: string;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  balance,
  referralLink,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  isNewUser = false,
  dailySessionCount,
  showLimitAlert,
  transactions,
  subscription,
  referrals,
  lastSessionTimestamp,
  isBotActive = true,
  selectedNavItem,
  setSelectedNavItem,
  username
}) => {
  const referralCount = referrals.length;
  const referralBonus = referralCount * 10;

  // Utiliser le seuil de retrait cohérent selon subscription
  const withdrawalThreshold = getWithdrawalThreshold(subscription);
  
  // Calculer le pourcentage d'avancement vers le seuil de retrait
  const withdrawalPercentage = balance > 0 ? Math.min(100, (balance / withdrawalThreshold) * 100) : 0;
  
  // Déterminer si l'utilisateur est un affiliateur actif (3+ affiliés)
  const isActiveReferrer = referralCount >= 3;
  
  // Déterminer si l'utilisateur a récemment parrainé quelqu'un (simulé)
  const hasRecentReferral = referrals.some(ref => {
    if (!ref.date && !ref.created_at) return false;
    const refDate = ref.date ? new Date(ref.date) : ref.created_at ? new Date(ref.created_at) : null;
    if (!refDate) return false;
    const daysSinceRef = (Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceRef < 7; // Dans les 7 derniers jours
  });

  // Message d'encouragement personnalisé
  const getMotivationalMessage = () => {
    if (isNewUser) return "Bienvenue! Démarrez votre première session pour commencer à générer des revenus!";
    if (isActiveReferrer) return "Félicitations! Votre statut VIP vous donne accès aux retraits prioritaires!";
    if (hasRecentReferral) return "Excellent travail! Votre dernier parrainage accélère votre progression!";
    if (withdrawalPercentage >= 75) return "Vous vous rapprochez rapidement de votre premier retrait!";
    if (withdrawalPercentage >= 50) return "Continuez ainsi, vous êtes sur la bonne voie!";
    if (referralCount > 0) return "Vos parrainages boostent votre progression, continuez!";
    return "Parrainez des amis pour débloquer des avantages exclusifs!";
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Message d'encouragement */}
      {!isNewUser && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/40 mb-4">
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
            {getMotivationalMessage()}
          </p>
        </div>
      )}
      
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
        withdrawalThreshold={withdrawalThreshold}
        lastSessionTimestamp={lastSessionTimestamp}
        isBotActive={isBotActive}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <DashboardTabs
            activeTab={selectedNavItem}
            setActiveTab={setSelectedNavItem}
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
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
