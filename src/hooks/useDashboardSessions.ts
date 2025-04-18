
import { useState, useEffect, useRef } from 'react';
import { UserData } from '@/types/userData';
import { useAutoSessions } from './sessions/useAutoSessions';
import { useManualSessions } from './sessions/manual/useManualSessions';
import { useWithdrawal } from './sessions/useWithdrawal';
import { useMidnightReset } from './sessions/useMidnightReset';

// Define the interface for the hook parameters
interface DashboardSessionsProps {
  userData: UserData | null;
  dailySessionCount: number;
  incrementSessionCount: () => Promise<void>;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  setShowLimitAlert: (show: boolean) => void;
  resetBalance: () => Promise<void>;
}

export const useDashboardSessions = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance,
  setShowLimitAlert,
  resetBalance
}: DashboardSessionsProps) => {
  const [lastSessionTimestamp, setLastSessionTimestamp] = useState<string | undefined>(undefined);
  const hasProcessedTransactions = useRef(false);
  const previousTransactionsLength = useRef<number | null>(null);
  const forceUpdateRef = useRef<NodeJS.Timeout | null>(null);
  
  // Extract timestamp of last session from transactions without creating loops
  useEffect(() => {
    // Check if transactions have changed to avoid unnecessary processing
    if (userData?.transactions && 
        (previousTransactionsLength.current === null || 
         previousTransactionsLength.current !== userData.transactions.length) && 
        !hasProcessedTransactions.current) {
      
      previousTransactionsLength.current = userData.transactions.length;
      hasProcessedTransactions.current = true;
      
      // Find the last transaction of type "Session manuelle"
      const manualSessions = userData.transactions.filter(
        tx => tx.report && tx.report.includes('Session manuelle')
      );
      
      if (manualSessions.length > 0) {
        // Sort by descending date to get the most recent
        manualSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Use the date of the most recent transaction
        const lastManualSessionDate = manualSessions[0].date;
        
        // Create ISO timestamp from the date (noon to avoid timezone issues)
        const lastDate = new Date(lastManualSessionDate);
        lastDate.setHours(12, 0, 0, 0);
        setLastSessionTimestamp(lastDate.toISOString());
        
        console.log("Dernière session manuelle détectée:", lastDate.toISOString());
      }
    }
    
    // Reset when userData changes significantly
    return () => {
      // Only reset when user data is completely different
      // not on every minor change in transactions
      if (!userData || !userData.transactions) {
        hasProcessedTransactions.current = false;
        previousTransactionsLength.current = null;
      }
    };
  }, [userData?.transactions]);  // Simplified dependency

  // Force refresh periodically to ensure data is up-to-date
  useEffect(() => {
    // Setup a timer to force refresh every 60 seconds
    if (!forceUpdateRef.current && userData?.profile?.id) {
      forceUpdateRef.current = setInterval(() => {
        // Trigger an event to force refresh balance display
        window.dispatchEvent(new CustomEvent('balance:force-update', { 
          detail: { timestamp: Date.now() }
        }));
      }, 60000);
    }
    
    return () => {
      if (forceUpdateRef.current) {
        clearInterval(forceUpdateRef.current);
        forceUpdateRef.current = null;
      }
    };
  }, [userData?.profile?.id]);

  // Create a safe userData object with default values to prevent null access
  const safeUserData = userData || { 
    profile: { id: null },
    balance: 0,
    transactions: [],
    subscription: 'freemium',
    username: '',
    referrals: [],
    referralLink: ''
  };

  // Use individual hooks for each functionality
  const { 
    lastAutoSessionTime, 
    activityLevel, 
    isBotActive,
    generateAutomaticRevenue
  } = useAutoSessions({
    userData: safeUserData,
    updateBalance,
    setShowLimitAlert
  });

  const { 
    isSessionRunning, 
    startSession,
    canStartSession 
  } = useManualSessions({
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance
  });

  const { handleWithdrawal, isProcessingWithdrawal } = useWithdrawal(
    safeUserData,
    resetBalance
  );

  // Set up midnight reset
  useMidnightReset();
  
  // Wrapped function to log and call the startSession function
  const handleStartSession = async () => {
    console.log("useDashboardSessions: handleStartSession called");
    try {
      await startSession();
    } catch (error) {
      console.error("Error in handleStartSession:", error);
    }
  };

  return {
    isStartingSession: isSessionRunning,
    handleStartSession,
    handleWithdrawal,
    isProcessingWithdrawal,
    lastSessionTimestamp,
    localBalance: userData?.balance || 0,
    isBotActive,
    generateAutomaticRevenue
  };
};

export default useDashboardSessions;
