
import { useState, useCallback, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardError from '@/components/dashboard/DashboardError';
import DailyLimitAlert from '@/components/dashboard/DailyLimitAlert';
import { useUserData } from '@/hooks/useUserData';
import { useDashboardSessions } from '@/hooks/useDashboardSessions';
import { canStartManualSession } from '@/utils/subscriptionUtils';
import { useDashboardInitialization } from '@/hooks/useDashboardInitialization';
import { toast } from '@/components/ui/use-toast';

const Dashboard = () => {
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  const [renderKey, setRenderKey] = useState(Date.now()); // Force re-renders when needed
  
  const {
    isAuthChecking,
    isReady,
    authError
  } = useDashboardInitialization();
  
  const {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    setShowLimitAlert,
    updateBalance,
    resetBalance,
    incrementSessionCount,
    isLoading,
    refreshUserData
  } = useUserData();
  
  const {
    isStartingSession,
    handleStartSession,
    handleWithdrawal
  } = useDashboardSessions(
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert,
    resetBalance
  );

  // Callback to force refresh when needed
  const forceRefresh = useCallback(() => {
    setRenderKey(Date.now());
    refreshUserData();
  }, [refreshUserData]);

  // One-time check on initial render to detect stale data
  useEffect(() => {
    if (!isAuthChecking && !isLoading && userData && userData.balance !== undefined) {
      console.log("Dashboard mounted with user data:", userData.username);
    }
  }, [isAuthChecking, isLoading, userData]);

  // Fonction pour activer l'essai Pro 48h
  const activateProTrial = () => {
    if (userData?.subscription === 'freemium') {
      // Définir l'expiration à 48h à partir de maintenant
      const expiryTime = Date.now() + (48 * 60 * 60 * 1000);
      
      // Stocker dans localStorage
      localStorage.setItem('proTrialActive', 'true');
      localStorage.setItem('proTrialExpires', expiryTime.toString());
      
      // Session utilisateur pour analytics
      localStorage.setItem('tempProDisplay', 'true');
      
      toast({
        title: "Félicitations !",
        description: "Votre période d'essai Pro de 48h a été activée. Profitez-en !",
      });
      
      // Forcer un rafraîchissement pour appliquer les changements
      forceRefresh();
    }
  };

  // Afficher un loader plus robuste pendant le chargement
  if (isAuthChecking || isLoading || !isReady) {
    return <DashboardLoading />;
  }

  // Afficher une page d'erreur si l'authentification échoue
  if (authError) {
    return <DashboardError errorType="auth" />;
  }

  // Vérification supplémentaire pour userData
  if (!userData || !userData.username) {
    return <DashboardError errorType="data" onRefresh={forceRefresh} />;
  }

  // Calculate referral count and bonus
  const referralCount = userData.referrals?.length || 0;
  const referralBonus = userData.referrals?.reduce((acc, ref) => acc + (ref.commission_rate || 0), 0) || 0;
  
  // Estimate daily limit based on subscription
  const dailyLimit = userData.subscription === 'freemium' ? 5 : 
                    userData.subscription === 'pro' ? 20 : 
                    userData.subscription === 'visionnaire' ? 50 : 100;

  // Enfin, afficher le tableau de bord
  return (
    <DashboardLayout
      key={renderKey}
      username={userData.username}
      subscription={userData.subscription}
      selectedNavItem={selectedNavItem}
      setSelectedNavItem={setSelectedNavItem}
    >
      <DailyLimitAlert 
        show={showLimitAlert} 
        subscription={userData.subscription}
        currentBalance={userData.balance}
      />
      
      <DashboardMetrics
        balance={userData.balance}
        referralLink={userData.referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        handleWithdrawal={handleWithdrawal}
        transactions={userData.transactions}
        isNewUser={isNewUser}
        subscription={userData.subscription}
        dailySessionCount={dailySessionCount}
        canStartSession={canStartManualSession(userData.subscription, dailySessionCount, userData.balance)}
        referralCount={referralCount}
        referralBonus={referralBonus}
        dailyLimit={dailyLimit}
        onActivateProTrial={activateProTrial}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
