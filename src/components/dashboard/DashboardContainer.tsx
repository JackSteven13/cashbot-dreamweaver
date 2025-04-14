
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardHeader from './DashboardHeader';
import DashboardMetrics from './DashboardMetrics';
import DashboardSkeleton from './DashboardSkeleton';
import UserDataStateTracker from './UserDataStateTracker';
import useUserDataSync from '@/hooks/useUserDataSync';
import { useActivitySimulation } from '@/hooks/sessions/useActivitySimulation';
import useDashboardSessions from '@/hooks/useDashboardSessions';
import { toast } from '@/components/ui/use-toast';

const DashboardContainer = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dailySessionCount, setDailySessionCount] = useState(0);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const initialLoadAttempted = useRef(false);
  const { syncUserData } = useUserDataSync();
  const { activityLevel, activeAgents } = useActivitySimulation();
  
  // Incrémenter le compteur de session
  const incrementSessionCount = async () => {
    setDailySessionCount(prevCount => prevCount + 1);
    // La mise à jour de la base de données est gérée ailleurs
    return Promise.resolve();
  };
  
  // Mettre à jour le solde
  const updateBalance = async (gain: number, report: string, forceUpdate = false) => {
    setUserData(prev => ({
      ...prev,
      balance: (prev?.balance || 0) + gain
    }));
    // La mise à jour de la base de données est gérée ailleurs
    return Promise.resolve();
  };
  
  // Réinitialiser le solde (pour les retraits)
  const resetBalance = async () => {
    setUserData(prev => ({ ...prev, balance: 0 }));
    // La mise à jour de la base de données est gérée ailleurs
    return Promise.resolve();
  };
  
  // Initialiser les sessions du dashboard
  const {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    isProcessingWithdrawal,
    lastSessionTimestamp,
    localBalance,
    isBotActive
  } = useDashboardSessions({
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert,
    resetBalance
  });
  
  // Handle initial data load
  useEffect(() => {
    if (user && !initialLoadAttempted.current) {
      console.log("Initial load of dashboard data");
      initialLoadAttempted.current = true;
      
      // Try to get cached data first
      const cachedName = localStorage.getItem('lastKnownUsername');
      const cachedSubscription = localStorage.getItem('subscription');
      const cachedBalance = localStorage.getItem('currentBalance');
      const cachedDailySessionCount = localStorage.getItem('dailySessionCount');
      
      if (cachedName) {
        setUsername(cachedName);
      }
      
      if (cachedSubscription || cachedBalance) {
        setUserData(prev => ({
          ...prev,
          subscription: cachedSubscription || 'freemium',
          balance: cachedBalance ? parseFloat(cachedBalance) : 0
        }));
      }
      
      if (cachedDailySessionCount) {
        setDailySessionCount(parseInt(cachedDailySessionCount));
      }
      
      // Trigger full data sync
      syncUserData(true).finally(() => {
        setIsLoading(false);
        
        // Afficher un toast pour confirmer le chargement des données
        toast({
          title: "Données synchronisées",
          description: "Vos données ont été chargées avec succès.",
          duration: 3000,
        });
      });
    }
  }, [user, syncUserData]);

  // Handle username loaded from UserDataStateTracker
  const handleUsernameLoaded = (name: string) => {
    console.log("Username loaded:", name);
    setUsername(name);
  };
  
  // Handle data refreshed from UserDataStateTracker
  const handleDataRefreshed = (data: any) => {
    console.log("Data refreshed:", data);
    
    setUserData(prev => ({
      ...prev,
      ...(data.balance !== undefined ? { balance: parseFloat(String(data.balance)) } : {}),
      ...(data.subscription !== undefined ? { subscription: data.subscription } : {}),
      ...(data.transactions !== undefined ? { transactions: data.transactions } : {}),
      ...(data.referralLink !== undefined ? { referralLink: data.referralLink } : {})
    }));
    
    if (data.daily_session_count !== undefined) {
      setDailySessionCount(parseInt(String(data.daily_session_count)));
    }
    
    setIsLoading(false);
  };

  // If no username is set, use a default
  const displayName = username || userData?.username || 'Utilisateur';

  // Show skeleton while loading initial data
  if (isLoading && !userData) {
    return <DashboardSkeleton username={displayName} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader 
        username={displayName} 
        isNewUser={isNewUser}
      />
      
      <main className="container mx-auto px-4 py-6">
        <DashboardMetrics
          balance={userData?.balance || localBalance || 0}
          referralLink={userData?.referralLink || ''}
          isStartingSession={isStartingSession}
          handleStartSession={handleStartSession}
          handleWithdrawal={handleWithdrawal}
          transactions={userData?.transactions || []}
          isNewUser={isNewUser}
          subscription={userData?.subscription || 'freemium'}
          dailySessionCount={dailySessionCount}
          canStartSession={true}
          referrals={userData?.referrals || []}
          lastSessionTimestamp={lastSessionTimestamp}
          isBotActive={isBotActive}
        />
      </main>
      
      {/* Invisible component to track data state changes */}
      <UserDataStateTracker 
        onUsernameLoaded={handleUsernameLoaded}
        onDataRefreshed={handleDataRefreshed}
        onSyncError={() => setIsLoading(false)}
      />
    </div>
  );
};

export default DashboardContainer;
