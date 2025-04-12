
import React, { useState, useEffect, useMemo } from 'react';
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

// Utilisons React.memo pour éviter les re-rendus inutiles
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
      {/* Afficher la limite quotidienne */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">
            Limite quotidienne ({subscription})
          </span>
          <span className="text-sm font-medium">
            {balanceManager.getDailyGains().toFixed(2)}€ / {dailyLimit}€
          </span>
        </div>
        <Progress value={limitProgress} className="h-2" />
      </div>
      
      {/* Contrôle du bot d'analyse */}
      <BotControlPanel 
        isBotActive={isBotActive}
        showLimitReached={showLimitAlert}
        subscription={subscription}
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
