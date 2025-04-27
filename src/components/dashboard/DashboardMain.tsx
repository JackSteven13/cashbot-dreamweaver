
import React, { Suspense, useEffect, useState } from 'react';
import DashboardContainer from './DashboardContainer';
import DashboardSkeleton from './DashboardSkeleton';
import BalanceAnimation from './BalanceAnimation';
import AutoProgressNotification from './AutoProgressNotification';
import SubscriptionSynchronizer from '@/components/subscriptions/SubscriptionSynchronizer';
import { useUserFetchRefactored } from '@/hooks/fetch/useUserFetchRefactored';
import { useAuth } from '@/hooks/useAuth';
import { useProfileData } from '@/hooks/auth/useProfileData';

interface DashboardMainProps {
  dashboardReady: boolean;
  username?: string;
  refreshData: () => void;
}

const DashboardMain: React.FC<DashboardMainProps> = ({ dashboardReady, username: initialUsername, refreshData }) => {
  const { userData, isNewUser, dailySessionCount, showLimitAlert } = useUserFetchRefactored();
  const { user } = useAuth();
  const [isStartingSession, setIsStartingSession] = useState(false);
  const { username: fetchedUsername, fetchProfileData } = useProfileData();
  const [displayName, setDisplayName] = useState<string | null>(initialUsername || null);
  
  // Fetch profile data when user is available but no username
  useEffect(() => {
    if (user?.id && (!displayName || displayName === "Utilisateur")) {
      fetchProfileData(user.id);
    }
  }, [user, displayName, fetchProfileData]);

  // Update displayName when initialUsername or fetchedUsername changes
  useEffect(() => {
    if (fetchedUsername && fetchedUsername !== "utilisateur") {
      setDisplayName(fetchedUsername);
    } else if (initialUsername && initialUsername !== "Utilisateur") {
      setDisplayName(initialUsername);
    } else if (userData?.username) {
      setDisplayName(userData.username);
    }
  }, [initialUsername, fetchedUsername, userData]);

  // Listen for username:loaded events
  useEffect(() => {
    const handleUsernameLoaded = (event: CustomEvent) => {
      if (event.detail?.username) {
        setDisplayName(event.detail.username);
      }
    };

    window.addEventListener('username:loaded', handleUsernameLoaded as EventListener);
    return () => {
      window.removeEventListener('username:loaded', handleUsernameLoaded as EventListener);
    };
  }, []);
  
  // Handle starting a session
  const handleStartSession = () => {
    setIsStartingSession(true);
    // Reset after animation completes
    setTimeout(() => setIsStartingSession(false), 2000);
  };
  
  // Handle withdrawal (placeholder)
  const handleWithdrawal = () => {
    console.log('Withdrawal requested');
  };
  
  // Try to get username from different sources and use fallback if not found
  const effectiveUsername = displayName || 
                           userData?.username || 
                           user?.user_metadata?.full_name ||
                           (user?.email ? user.email.split('@')[0] : "Utilisateur");
  
  return (
    <div className={`transition-opacity duration-500 ${dashboardReady ? 'opacity-100' : 'opacity-0'}`}>
      <Suspense fallback={<DashboardSkeleton username={effectiveUsername || "Préparation..."} />}>
        <DashboardContainer 
          userData={userData}
          balance={userData?.balance || 0}
          referralLink={userData?.referralLink || window.location.origin + '/register?ref=user'}
          isStartingSession={isStartingSession}
          handleStartSession={handleStartSession}
          handleWithdrawal={handleWithdrawal}
          transactions={userData?.transactions || []}
          isNewUser={isNewUser}
          subscription={userData?.subscription || 'freemium'}
          showLimitAlert={showLimitAlert}
          dailySessionCount={dailySessionCount}
          referrals={userData?.referrals || []}
          isBotActive={true}
          username={effectiveUsername}
        />
      </Suspense>
      <BalanceAnimation position="top-right" />
      <AutoProgressNotification />
      <SubscriptionSynchronizer onSync={(subscription) => {
        console.log("Subscription synchronized:", subscription);
        refreshData();
      }} />
    </div>
  );
};

export default DashboardMain;
