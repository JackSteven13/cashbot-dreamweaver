
import React, { useEffect, useMemo } from 'react';
import DashboardMetrics from './DashboardMetrics';
import LimitReachedAlert from './alerts/LimitReachedAlert';
import DormantAccountAlert from './alerts/DormantAccountAlert';
import FirstTimeWelcome from './welcome/FirstTimeWelcome';
import { useReferralSystem } from '@/hooks/useReferralSystem';
import { useTerminalAnalysis } from '@/hooks/useTerminalAnalysis';
import TerminalOverlay from './terminal/TerminalOverlay';

interface DashboardContentProps {
  isDormant?: boolean;
  dormancyData?: any;
  showLimitAlert?: boolean;
  isNewUser?: boolean;
  userData: any;
  isStartingSession?: boolean;
  handleStartSession?: () => void;
  handleWithdrawal?: () => void;
  dailySessionCount?: number;
  handleReactivate?: () => void;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  isDormant = false,
  dormancyData = {},
  showLimitAlert = false,
  isNewUser = false,
  userData = {},
  isStartingSession = false,
  handleStartSession,
  handleWithdrawal,
  dailySessionCount = 0,
  handleReactivate,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  // Utiliser le hook de terminal avec le support du mode arrière-plan
  const { 
    showAnalysis, 
    terminalLines, 
    analysisComplete, 
    limitReached, 
    countdownTime,
    isBackgroundMode 
  } = useTerminalAnalysis();

  // Utiliser le système de parrainage pour l'affichage du lien
  const { referralLink } = useReferralSystem(userData?.profile?.id);
  
  // Memoizer les props qui ne devraient pas déclencher de re-rendu inutile
  const memoizedUserData = useMemo(() => userData, [
    userData.username,
    userData.balance,
    userData.subscription,
    userData.transactions?.length
  ]);
  
  // Extraire des données supplémentaires pour les rapports
  const canStartSession = !showLimitAlert && !isStartingSession;
  
  return (
    <div className="dashboard-content h-full">
      {/* First-time welcome modal */}
      {isNewUser && <FirstTimeWelcome referralLink={referralLink} />}
      
      {/* Alert for dormant accounts */}
      {isDormant && !isNewUser && (
        <DormantAccountAlert 
          data={dormancyData} 
          onReactivate={handleReactivate}
        />
      )}
      
      {/* Alert for daily limit reached */}
      {showLimitAlert && !isNewUser && !isDormant && (
        <LimitReachedAlert subscription={userData?.subscription || 'freemium'} />
      )}
      
      {/* Terminal overlay with background mode support */}
      {showAnalysis && (
        <TerminalOverlay 
          lines={terminalLines}
          complete={analysisComplete}
          limitReached={limitReached}
          countdownTime={countdownTime}
          isBackground={isBackgroundMode}
        />
      )}
      
      {/* Main dashboard metrics */}
      <DashboardMetrics
        balance={userData.balance || 0}
        referralLink={referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        handleWithdrawal={handleWithdrawal}
        transactions={userData.transactions || []}
        isNewUser={isNewUser}
        subscription={userData.subscription || 'freemium'}
        dailySessionCount={dailySessionCount}
        canStartSession={canStartSession}
        referrals={userData.referrals || []}
        lastSessionTimestamp={lastSessionTimestamp}
        isBotActive={isBotActive}
      />
    </div>
  );
};

export default DashboardContent;
