
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserFetchRefactored } from '@/hooks/fetch/useUserFetchRefactored';
import { useBalanceActions } from '@/hooks/useBalanceActions';
import { useSessionOperations } from '@/hooks/sessions/useSessionOperations';
import { useAutoSessions } from '@/hooks/sessions/useAutoSessions';
import DailyLimitAlert from '@/components/dashboard/DailyLimitAlert';
import SystemTerminal from '@/components/dashboard/terminal/SystemTerminal';
import { Button } from '@/components/ui/button';
import { Power as PowerIcon } from 'lucide-react';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { getSubscription } from '@/utils/userDataUtils';

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // First, get the user data
  const { 
    userData, 
    isNewUser, 
    dailySessionCount, 
    showLimitAlert, 
    isLoading, 
    setShowLimitAlert 
  } = useUserFetchRefactored();
  
  // Define updateBalance function before using it
  const { updateBalance, resetBalance } = useBalanceActions({
    userData: userData,
    dailySessionCount: dailySessionCount,
    setUserData: () => {}, // No direct state update needed here
    setDailySessionCount: () => {}, // No direct state update needed here
    setShowLimitAlert: setShowLimitAlert
  });
  
  // Now we can use updateBalance in other hooks
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
  
  const [isStartingSession, setIsStartingSession] = useState(false);
  
  const handleStartSession = useCallback(async () => {
    if (isStartingSession) return;
    
    setIsStartingSession(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const randomGain = Math.random() * 0.5;
      
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
  
  const handleWithdrawal = useCallback(async () => {
    try {
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
          subscription={getSubscription(userData)}
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
        subscription={getSubscription(userData)}
        dailySessionCount={dailySessionCount}
        canStartSession={true}
        referrals={userData?.referrals || []}
        lastSessionTimestamp={lastAutoSessionTime}
        isBotActive={isBotActive}
        userId={userData?.profile?.id || userData?.id}
      />
      
      <SystemTerminal
        isNewUser={isNewUser}
        dailyLimit={0.5} // This now matches the expected number type
        subscription={getSubscription(userData)}
        remainingSessions={dailySessionCount}
        referralCount={userData?.referrals?.length || 0}
        displayBalance={userData?.balance || 0} // This now matches the expected number type
        referralBonus={0} // This now matches the expected number type
        lastSessionTimestamp={lastAutoSessionTime}
        isBotActive={isBotActive}
      />
    </div>
  );
};

export default Dashboard;
