
import { useState, useEffect, useRef } from 'react';
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
  const hasProcessedTransactions = useRef(false);
  const previousTransactionsLength = useRef<number | null>(null);
  
  // Extraire le timestamp de la dernière session à partir des transactions sans créer de boucle
  useEffect(() => {
    // Vérifier si les transactions ont changé pour éviter les traitements inutiles
    if (userData?.transactions && 
        (previousTransactionsLength.current === null || 
         previousTransactionsLength.current !== userData.transactions.length) && 
        !hasProcessedTransactions.current) {
      
      previousTransactionsLength.current = userData.transactions.length;
      hasProcessedTransactions.current = true;
      
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
    
    // Réinitialiser lorsque userData change significativement
    return () => {
      // Ne réinitialiser que lorsque les données utilisateur sont complètement différentes
      // pas à chaque changement mineur dans les transactions
      if (!userData || !userData.transactions) {
        hasProcessedTransactions.current = false;
        previousTransactionsLength.current = null;
      }
    };
  }, [userData?.transactions]);  // Dépendance simplifiée

  // Utiliser les hooks individuels pour chaque fonctionnalité
  const { 
    lastAutoSessionTime, 
    activityLevel, 
    generateAutomaticRevenue,
    isBotActive 
  } = useAutoSessions(
    userData,
    updateBalance,
    setShowLimitAlert
  );

  const { isStartingSession, handleStartSession, localBalance } = useManualSessions({
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

  // Configurer la réinitialisation de minuit
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
    isProcessingWithdrawal: isProcessingWithdrawal,
    lastSessionTimestamp,
    localBalance,  // Exposer le solde local pour éviter les problèmes de synchronisation
    isBotActive    // Expose the bot active status
  };
};

export default useDashboardSessions;
