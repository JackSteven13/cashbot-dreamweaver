
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from './DashboardLayout';
import DashboardContent from './DashboardContent';
import DashboardSkeleton from './DashboardSkeleton';
import UserDataStateTracker from './UserDataStateTracker';
import TerminalOverlay from './terminal/TerminalOverlay';
import useDashboardSessions from '@/hooks/useDashboardSessions';
import useTerminalAnalysis from '@/hooks/useTerminalAnalysis';
import { toast } from '@/components/ui/use-toast';
import { simulateActivity } from '@/utils/animations';
import { useActivitySimulation } from '@/hooks/sessions/useActivitySimulation';

const DashboardContainer = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [selectedNavItem, setSelectedNavItem] = useState('overview');
  const [userData, setUserData] = useState<any>({
    profile: { id: null },
    balance: 0,
    transactions: [],
    subscription: 'freemium',
    referralLink: '',
    referrals: []
  });
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dailySessionCount, setDailySessionCount] = useState(0);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [activityLevels, setActivityLevels] = useState<number[]>([]);
  const [lastInitTime, setLastInitTime] = useState<number>(0);
  
  const initialLoadAttempted = useRef(false);
  const fastLoadRef = useRef<boolean>(false);
  
  // Get our hooks
  const { terminalLines, showAnalysis, analysisComplete, limitReached } = useTerminalAnalysis();
  const { activityLevel } = useActivitySimulation();
  
  // Incrémenter le compteur de session
  const incrementSessionCount = async () => {
    setDailySessionCount(prevCount => prevCount + 1);
    return Promise.resolve();
  };
  
  // Mettre à jour le solde
  const updateBalance = async (gain: number, report: string, forceUpdate = false) => {
    setUserData(prev => ({
      ...prev,
      balance: (prev?.balance || 0) + gain,
      transactions: [{
        id: Math.random().toString(36).substring(7),
        date: new Date().toISOString(),
        gain,
        report,
        type: 'Session'
      }, ...(prev?.transactions || [])]
    }));
    return Promise.resolve();
  };
  
  // Réinitialiser le solde (pour les retraits)
  const resetBalance = async () => {
    setUserData(prev => ({ ...prev, balance: 0 }));
    return Promise.resolve();
  };
  
  // Initialize dashboard sessions
  const {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp,
    isBotActive
  } = useDashboardSessions({
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert,
    resetBalance
  });
  
  // Fast load effect - try to show something quickly on first load
  useEffect(() => {
    if (!fastLoadRef.current) {
      fastLoadRef.current = true;
      const cachedName = localStorage.getItem('lastKnownUsername');
      const cachedBalance = localStorage.getItem('lastKnownBalance');
      
      if (cachedName) {
        setUsername(cachedName);
      }
      
      if (cachedBalance) {
        setUserData(prev => ({
          ...prev,
          balance: parseFloat(cachedBalance) 
        }));
      }
    }
  }, []);
  
  // More complete initial data load
  useEffect(() => {
    const now = Date.now();
    
    // Avoid frequent reloads if another is in progress (debounce)
    if (now - lastInitTime < 2000 && lastInitTime !== 0) {
      return;
    }
    
    if (user && !initialLoadAttempted.current) {
      console.log("Initial load of dashboard data");
      setLastInitTime(now);
      initialLoadAttempted.current = true;
      
      // Simulate loading initial data
      setTimeout(() => {
        setIsLoading(false);
        
        // Simulate activity after load
        simulateActivity();
        
        toast({
          title: "Tableau de bord activé",
          description: "Les agents IA sont maintenant en fonction.",
          duration: 3000,
        });
      }, 800);
    }
  }, [user, lastInitTime]);

  // Handle username loaded
  const handleUsernameLoaded = (name: string) => {
    setUsername(name);
  };
  
  // Handle data refreshed
  const handleDataRefreshed = (data: any) => {
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
  if (isLoading) {
    return <DashboardSkeleton username={displayName} />;
  }

  return (
    <>
      <DashboardLayout 
        username={displayName} 
        subscription={userData?.subscription || 'freemium'}
        selectedNavItem={selectedNavItem}
        setSelectedNavItem={setSelectedNavItem}
      >
        <DashboardContent
          userData={userData}
          isStartingSession={isStartingSession}
          handleStartSession={handleStartSession}
          handleWithdrawal={handleWithdrawal}
          isNewUser={isNewUser}
          dailySessionCount={dailySessionCount}
          showLimitAlert={showLimitAlert}
          lastSessionTimestamp={lastSessionTimestamp}
          isBotActive={isBotActive}
        />
      </DashboardLayout>
      
      {/* Terminal overlay with animations */}
      {showAnalysis && (
        <TerminalOverlay 
          lines={terminalLines} 
          isComplete={analysisComplete}
          isLimitReached={limitReached}
          isDismissable={analysisComplete}
        />
      )}
      
      {/* Invisible component to track data state changes */}
      <UserDataStateTracker 
        onUsernameLoaded={handleUsernameLoaded}
        onDataRefreshed={handleDataRefreshed}
        onSyncError={() => setIsLoading(false)}
      />
    </>
  );
};

export default DashboardContainer;
