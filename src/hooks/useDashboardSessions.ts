
import { useState, useEffect, useRef } from 'react';
import { UserData } from '@/types/userData';
import { useAutoSessions } from './sessions/useAutoSessions';
import { useManualSessions } from './sessions/useManualSessions';
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

  // Create a safe userData object with default values to prevent null access
  const safeUserData = userData || { 
    profile: { id: null },
    balance: 0,
    transactions: [],
    subscription: 'freemium'
  };

  // Use individual hooks for each functionality
  const { 
    lastAutoSessionTime, 
    activityLevel, 
    generateAutomaticRevenue,
    isBotActive 
  } = useAutoSessions(
    safeUserData, // Pass the safe object instead of potentially null userData
    updateBalance,
    setShowLimitAlert
  );

  const { isStartingSession, handleStartSession, localBalance } = useManualSessions({
    userData: safeUserData, // Pass the safe object here too
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert
  });

  const { handleWithdrawal, isProcessingWithdrawal } = useWithdrawal(
    safeUserData, // And here
    resetBalance
  );

  // Set up midnight reset
  useMidnightReset(
    safeUserData, // And here
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert
  );

  return {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    isProcessingWithdrawal,
    lastSessionTimestamp,
    localBalance,
    isBotActive
  };
};

export default useDashboardSessions;
