
import React, { useState } from 'react';
import DashboardMetrics from './DashboardMetrics';
import BotControlPanel from './bot/BotControlPanel';
import { Progress } from '@/components/ui/progress';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';

interface DashboardContentProps {
  userData: any;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void;
  isNewUser: boolean;
  dailySessionCount: number;
  showLimitAlert: boolean;
  isDormant?: boolean;
  dormancyData?: any;
  handleReactivate?: () => void;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  userData,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  isNewUser,
  dailySessionCount = 0,
  showLimitAlert,
  isDormant = false,
  dormancyData,
  handleReactivate,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  // État local pour suivre la progression de la limite quotidienne
  const [limitProgress, setLimitProgress] = useState<number>(0);
  
  // Calculer la progression de la limite quotidienne
  React.useEffect(() => {
    const dailyGains = balanceManager.getDailyGains();
    const dailyLimit = SUBSCRIPTION_LIMITS[userData?.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    const progressPercentage = Math.min(100, (dailyGains / dailyLimit) * 100);
    setLimitProgress(progressPercentage);
    
    // Écouter les mises à jour des gains quotidiens
    const handleDailyGainsUpdate = () => {
      const updatedGains = balanceManager.getDailyGains();
      const updatedProgress = Math.min(100, (updatedGains / dailyLimit) * 100);
      setLimitProgress(updatedProgress);
    };
    
    window.addEventListener('dailyGains:updated' as any, handleDailyGainsUpdate);
    window.addEventListener('dailyGains:reset' as any, handleDailyGainsUpdate);
    
    return () => {
      window.removeEventListener('dailyGains:updated' as any, handleDailyGainsUpdate);
      window.removeEventListener('dailyGains:reset' as any, handleDailyGainsUpdate);
    };
  }, [userData?.subscription]);
  
  return (
    <div className="px-4 md:px-6 py-6 md:py-8 max-w-6xl mx-auto animate-fadein">
      {/* Afficher la limite quotidienne */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">
            Limite quotidienne ({userData?.subscription || 'freemium'})
          </span>
          <span className="text-sm font-medium">
            {balanceManager.getDailyGains().toFixed(2)}€ / {SUBSCRIPTION_LIMITS[userData?.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5}€
          </span>
        </div>
        <Progress value={limitProgress} className="h-2" />
      </div>
      
      {/* Contrôle du bot d'analyse */}
      <BotControlPanel 
        isBotActive={isBotActive}
        showLimitReached={showLimitAlert}
        subscription={userData?.subscription || 'freemium'}
        userId={userData?.profile?.id}
      />
      
      {/* Métriques du tableau de bord */}
      <DashboardMetrics
        balance={userData?.balance || 0}
        referralLink={userData?.referralLink || ''}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        handleWithdrawal={handleWithdrawal}
        transactions={userData?.transactions || []}
        isNewUser={isNewUser}
        subscription={userData?.subscription || 'freemium'}
        dailySessionCount={dailySessionCount}
        canStartSession={!isDormant && !showLimitAlert}
        referrals={userData?.referrals || []}
        lastSessionTimestamp={lastSessionTimestamp}
        isBotActive={isBotActive}
      />
    </div>
  );
};

export default DashboardContent;
