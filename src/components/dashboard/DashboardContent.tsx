import React, { useState, useEffect, useMemo } from 'react';
import DashboardMetrics from './DashboardMetrics';
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

const DashboardContent: React.FC<DashboardContentProps> = React.memo(({
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
  
  // Mémoriser la subscription pour éviter les recalculs inutiles
  const subscription = useMemo(() => 
    userData?.subscription || 'freemium', 
    [userData?.subscription]
  );
  
  // Mémoriser la limite quotidienne également
  const dailyLimit = useMemo(() => 
    SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5,
    [subscription]
  );
  
  // Calculer la progression de la limite quotidienne
  useEffect(() => {
    const updateProgress = () => {
      const dailyGains = balanceManager.getDailyGains();
      const progressPercentage = Math.min(100, (dailyGains / dailyLimit) * 100);
      setLimitProgress(progressPercentage);
    };
    
    // Calculer immédiatement
    updateProgress();
    
    // Écouter les mises à jour des gains quotidiens
    window.addEventListener('dailyGains:updated', updateProgress);
    window.addEventListener('dailyGains:reset', updateProgress);
    
    return () => {
      window.removeEventListener('dailyGains:updated', updateProgress);
      window.removeEventListener('dailyGains:reset', updateProgress);
    };
  }, [dailyLimit]);
  
  return (
    <div className="px-4 md:px-6 py-6 md:py-8 max-w-6xl mx-auto animate-fadein">
      {/* Afficher la limite quotidienne avec design amélioré */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl shadow-sm">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Limite quotidienne ({subscription})
          </span>
          <span className="text-sm font-bold text-blue-800 dark:text-blue-300">
            {balanceManager.getDailyGains().toFixed(2)}€ / {dailyLimit}€
          </span>
        </div>
        <Progress 
          value={limitProgress} 
          className="h-2.5 bg-blue-100 dark:bg-blue-900/30"
        />
      </div>
      
      {/* Métriques du tableau de bord */}
      <DashboardMetrics
        balance={userData?.balance || 0}
        referralLink={userData?.referralLink || ''}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        handleWithdrawal={handleWithdrawal}
        transactions={userData?.transactions || []}
        isNewUser={isNewUser}
        subscription={subscription}
        dailySessionCount={dailySessionCount}
        canStartSession={!isDormant && !showLimitAlert}
        referrals={userData?.referrals || []}
        lastSessionTimestamp={lastSessionTimestamp}
        isBotActive={isBotActive}
      />
    </div>
  );
});

DashboardContent.displayName = 'DashboardContent';
export default DashboardContent;
