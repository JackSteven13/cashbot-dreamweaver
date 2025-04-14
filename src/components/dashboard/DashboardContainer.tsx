
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardHeader from './DashboardHeader';
import DashboardMetrics from './DashboardMetrics';
import DashboardSkeleton from './DashboardSkeleton';
import UserDataStateTracker from './UserDataStateTracker';
import useUserDataSync from '@/hooks/useUserDataSync';
import { useActivitySimulation } from '@/hooks/sessions/useActivitySimulation';

const DashboardContainer = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadAttempted = useRef(false);
  const { syncUserData } = useUserDataSync();
  const { activityLevel, activeAgents } = useActivitySimulation();
  
  // Handle initial data load
  useEffect(() => {
    if (user && !initialLoadAttempted.current) {
      console.log("Initial load of dashboard data");
      initialLoadAttempted.current = true;
      
      // Try to get cached data first
      const cachedName = localStorage.getItem('lastKnownUsername');
      const cachedSubscription = localStorage.getItem('subscription');
      const cachedBalance = localStorage.getItem('currentBalance');
      
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
      
      // Trigger full data sync
      syncUserData(true).finally(() => {
        setIsLoading(false);
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
          balance={userData?.balance || 0}
          referralLink={userData?.referralLink || ''}
          isStartingSession={false}
          handleStartSession={() => {}}
          transactions={userData?.transactions || []}
          subscription={userData?.subscription || 'freemium'}
          isNewUser={isNewUser}
          dailySessionCount={userData?.dailySessionCount || 0}
          canStartSession={true}
          referrals={userData?.referrals || []}
          isBotActive={activityLevel > 0}
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
