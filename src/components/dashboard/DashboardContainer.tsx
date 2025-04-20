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
import { simulateActivity } from '@/utils/animations/moneyParticles';
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
  const periodicUpdateRef = useRef<NodeJS.Timeout | null>(null);
  
  const { terminalLines, showAnalysis, analysisComplete, limitReached } = useTerminalAnalysis();
  const { activityLevel } = useActivitySimulation();
  
  const incrementSessionCount = async () => {
    setDailySessionCount(prevCount => prevCount + 1);
    return Promise.resolve();
  };
  
  const updateBalance = async (gain: number, report: string, forceUpdate = false) => {
    console.log(`Updating balance with gain: ${gain}, report: ${report}`);
    
    setUserData(prev => ({
      ...prev,
      balance: parseFloat((prev?.balance || 0) + gain).toFixed(2),
      transactions: [{
        id: Math.random().toString(36).substring(7),
        date: new Date().toISOString(),
        gain,
        report,
        type: 'Session'
      }, ...(prev?.transactions || [])]
    }));
    
    window.dispatchEvent(new CustomEvent('balance:update', {
      detail: { amount: gain, animate: true }
    }));
    
    return Promise.resolve();
  };
  
  const resetBalance = async () => {
    setUserData(prev => ({ ...prev, balance: 0 }));
    return Promise.resolve();
  };
  
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
  
  useEffect(() => {
    const now = Date.now();
    
    if (now - lastInitTime < 2000 && lastInitTime !== 0) {
      return;
    }
    
    if (user && !initialLoadAttempted.current) {
      console.log("Initial load of dashboard data");
      setLastInitTime(now);
      initialLoadAttempted.current = true;
      
      setTimeout(() => {
        setIsLoading(false);
        
        simulateActivity();
        
        toast({
          title: "Tableau de bord activé",
          description: "Les agents IA sont maintenant en fonction.",
          duration: 3000,
        });
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('bot:status-change', {
            detail: { active: true }
          }));
        }, 1000);
      }, 500);
    }
  }, [user, lastInitTime]);
  
  useEffect(() => {
    if (!periodicUpdateRef.current && !isLoading) {
      periodicUpdateRef.current = setInterval(() => {
        console.log("Periodic data refresh");
        
        window.dispatchEvent(new CustomEvent('balance:force-update', {
          detail: { timestamp: Date.now() }
        }));
        
        if (Math.random() > 0.5) {
          simulateActivity();
        }
      }, 15000);
    }
    
    return () => {
      if (periodicUpdateRef.current) {
        clearInterval(periodicUpdateRef.current);
        periodicUpdateRef.current = null;
      }
    };
  }, [isLoading]);
  
  const handleUsernameLoaded = (name: string) => {
    setUsername(name);
  };
  
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

  const displayName = username || userData?.username || 'Utilisateur';

  if (isLoading) {
    return <DashboardSkeleton username={displayName} />;
  }

  const formattedLines = terminalLines && Array.isArray(terminalLines) 
    ? terminalLines.map(line => (typeof line === 'string' ? { text: line, type: 'info' } : line))
    : [];

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
          isBotActive={true}
        />
      </DashboardLayout>
      
      {showAnalysis && formattedLines && (
        <TerminalOverlay 
          lines={formattedLines} 
          isComplete={analysisComplete}
          isLimitReached={limitReached}
          isDismissable={analysisComplete}
        />
      )}
      
      <UserDataStateTracker 
        onUsernameLoaded={handleUsernameLoaded}
        onDataRefreshed={handleDataRefreshed}
        onSyncError={() => setIsLoading(false)}
      />
    </>
  );
};

export default DashboardContainer;
