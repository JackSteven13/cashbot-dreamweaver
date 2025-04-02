
import { useState, useEffect } from 'react';
import { UserData } from '@/types/userData';
import { useAutoSessions } from './sessions/useAutoSessions';
import { useManualSessions } from './sessions/useManualSessions';
import { useWithdrawal } from './sessions/useWithdrawal';
import { useMidnightReset } from './sessions/useMidnightReset';

export const useDashboardSessions = (
  userData: UserData,
  dailySessionCount: number,
  incrementSessionCount: () => Promise<void>,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void,
  resetBalance: () => Promise<void>
) => {
  const [lastSessionTimestamp, setLastSessionTimestamp] = useState<string | undefined>(undefined);
  
  // Extraire le timestamp de la dernière session à partir des transactions
  useEffect(() => {
    if (userData?.transactions && userData.transactions.length > 0) {
      // Recherche de la dernière transaction de type "Session manuelle"
      const manualSessions = userData.transactions.filter(
        tx => tx.report && tx.report.includes('Session manuelle')
      );
      
      if (manualSessions.length > 0) {
        // Trier par date décroissante pour obtenir la plus récente
        manualSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Utiliser la date de la transaction la plus récente
        const lastManualSessionDate = manualSessions[0].date;
        
        // Créer un timestamp ISO à partir de la date (midi pour éviter les problèmes de fuseaux horaires)
        const lastDate = new Date(lastManualSessionDate);
        lastDate.setHours(12, 0, 0, 0);
        setLastSessionTimestamp(lastDate.toISOString());
        
        console.log("Dernière session manuelle détectée:", lastDate.toISOString());
      }
    }
  }, [userData?.transactions]);

  // Use the individual hooks for each functionality
  useAutoSessions(
    userData,
    updateBalance,
    setShowLimitAlert
  );

  const { isStartingSession, handleStartSession } = useManualSessions({
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert
  });

  const { handleWithdrawal, isProcessingWithdrawal } = useWithdrawal(
    userData,
    resetBalance
  );

  // Set up midnight reset
  useMidnightReset(
    userData,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert
  );

  return {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    isProcessingWithdrawal,
    lastSessionTimestamp
  };
};

export default useDashboardSessions;
