import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserFetchRefactored } from '@/hooks/fetch/useUserFetchRefactored';
import { useBalanceActions } from '@/hooks/useBalanceActions';
import { useSessionOperations } from '@/hooks/sessions/useSessionOperations';
import { useAutoSessions } from '@/hooks/sessions/useAutoSessions';
import { DailyLimitAlert } from '@/components/dashboard/DailyLimitAlert';
import { SystemTerminal } from '@/components/dashboard/terminal/SystemTerminal';
import { Button } from '@/components/ui/button';
import { PowerIcon } from '@radix-ui/react-icons';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Fetch user data and actions
  const { 
    userData, 
    isNewUser, 
    dailySessionCount, 
    showLimitAlert, 
    isLoading, 
    setShowLimitAlert 
  } = useUserFetchRefactored();
  
  // Balance actions
  const { updateBalance, resetBalance } = useBalanceActions({
    userData: userData,
    dailySessionCount: dailySessionCount,
    setUserData: () => {}, // No direct state update needed here
    setDailySessionCount: () => {}, // No direct state update needed here
    setShowLimitAlert: setShowLimitAlert
  });
  
  // State for session management
  const [isStartingSession, setIsStartingSession] = useState(false);
  
  // Automatic session management
  const { 
    lastAutoSessionTime,
    activityLevel,
    generateAutomaticRevenue,
    isSessionInProgress,
    isBotActive
  } = useAutoSessions(
    userData,
    updateBalance,
    setShowLimitAlert
  );
  
  // Manual session start handler
  const handleStartSession = useCallback(async () => {
    if (isStartingSession) return;
    
    setIsStartingSession(true);
    
    try {
      // Simulate session processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate random gain (replace with actual logic)
      const randomGain = Math.random() * 0.5;
      
      // Update balance
      await updateBalance(randomGain, "Manual session gain");
      
      toast({
        title: "Session terminée",
        description: `+ ${randomGain.toFixed(2)}€`,
      });
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la session. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsStartingSession(false);
    }
  }, [isStartingSession, updateBalance, toast]);
  
  // Withdrawal handler
  const handleWithdrawal = useCallback(async () => {
    try {
      // Reset balance
      await resetBalance();
      
      toast({
        title: "Retrait effectué",
        description: "Votre solde a été remis à zéro.",
      });
    } catch (error) {
      console.error("Error during withdrawal:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le retrait. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  }, [resetBalance, toast]);
  
  // Bot status change handler
  const handleBotStatusChange = (active: boolean) => {
    if (active) {
      generateAutomaticRevenue(true);
    }
  };
  
  return (
    <div className="dashboard-container">
      {showLimitAlert && (
        <DailyLimitAlert 
          show={showLimitAlert}
          subscription={userData?.profile?.subscription || 'freemium'}
          currentBalance={userData?.balance || 0}
        />
      )}
      
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          className="bg-red-50 text-red-500 hover:bg-red-100"
          onClick={() => navigate('/logout')}
        >
          <PowerIcon className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
      
      <DashboardMetrics 
        balance={userData?.balance || 0}
        referralLink={userData?.referralLink || ''}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        handleWithdrawal={handleWithdrawal}
        transactions={userData?.transactions || []}
        isNewUser={isNewUser}
        subscription={userData?.profile?.subscription || 'freemium'}
        dailySessionCount={dailySessionCount}
        canStartSession={true}
        referrals={userData?.referrals || []}
        lastSessionTimestamp={lastAutoSessionTime}
        isBotActive={isBotActive}
        userId={userData?.profile?.id || userData?.id}
      />
      
      <SystemTerminal
        isNewUser={isNewUser}
        dailyLimit={0.5}
        subscription={userData?.profile?.subscription || 'freemium'}
        remainingSessions={dailySessionCount}
        referralCount={userData?.referrals?.length || 0}
        displayBalance={userData?.balance || 0}
        referralBonus={0}
        lastSessionTimestamp={lastAutoSessionTime}
        isBotActive={isBotActive}
      />
    </div>
  );
};

export default Dashboard;
