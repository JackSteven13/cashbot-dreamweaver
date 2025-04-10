
import React, { useState, useCallback, useEffect } from 'react';
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
  
  // Bot state management
  const [localBotActive, setLocalBotActive] = useState(true);
  
  // Effect to disable bot when daily limit is reached
  useEffect(() => {
    if (showLimitAlert) {
      setLocalBotActive(false);
    }
  }, [showLimitAlert]);
  
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
    if (isStartingSession || showLimitAlert) return;
    
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
  }, [isStartingSession, updateBalance, toast, showLimitAlert]);
  
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
  
  // Daily limit calculation
  const effectiveSubscription = getSubscription(userData);
  let dailyLimit = 0.5; // Default for freemium
  if (effectiveSubscription === 'starter') dailyLimit = 5;
  if (effectiveSubscription === 'gold') dailyLimit = 20;
  if (effectiveSubscription === 'elite') dailyLimit = 50;
  
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
        canStartSession={!showLimitAlert}
        referrals={userData?.referrals || []}
        lastSessionTimestamp={lastAutoSessionTime}
        isBotActive={isBotActive && !showLimitAlert}
        userId={userData?.profile?.id || userData?.id}
      />
      
      <SystemTerminal
        isNewUser={isNewUser}
        dailyLimit={dailyLimit}  // Properly typed as number
        subscription={getSubscription(userData)}
        remainingSessions={dailySessionCount}
        referralCount={userData?.referrals?.length || 0}
        displayBalance={userData?.balance || 0}  // Properly typed as number
        referralBonus={(userData?.referrals?.reduce((sum, ref) => sum + (ref.commission_rate || 0), 0) || 0)}  // Properly typed as number
        lastSessionTimestamp={lastAutoSessionTime}
        isBotActive={isBotActive && !showLimitAlert}
      />
    </div>
  );
};

export default Dashboard;
