
import { useState, useCallback, useRef, useEffect } from 'react';
import { useManualSessions } from './sessions/manual/useManualSessions';
import { toast } from '@/components/ui/use-toast';
import { useBotStatus } from '@/hooks/dashboard/sessions/useBotStatus';
import balanceManager from '@/utils/balance/balanceManager';

const useDashboardSessions = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance,
  setShowLimitAlert,
  resetBalance
}: {
  userData: any;
  dailySessionCount: number;
  incrementSessionCount: () => Promise<void>;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  setShowLimitAlert: (show: boolean) => void;
  resetBalance: () => Promise<void>;
}) => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [lastSessionTimestamp, setLastSessionTimestamp] = useState<number | null>(Number(localStorage.getItem('lastSessionTimestamp')) || null);
  const { isBotActive } = useBotStatus();
  const persistedBalanceRef = useRef<number | null>(null);

  // Persist the last session timestamp between page loads
  useEffect(() => {
    if (lastSessionTimestamp) {
      localStorage.setItem('lastSessionTimestamp', lastSessionTimestamp.toString());
    }
  }, [lastSessionTimestamp]);
  
  // Ensure balance is correctly initialized and persisted
  useEffect(() => {
    if (userData && userData.balance !== undefined) {
      // Initialize the balance manager with the current value
      balanceManager.forceBalanceSync(userData.balance, userData.id);
      persistedBalanceRef.current = userData.balance;
      
      // Store balance in localStorage for persistence between sessions
      localStorage.setItem('currentBalance', userData.balance.toString());
      localStorage.setItem('lastKnownBalance', userData.balance.toString());
    }
  }, [userData]);

  const manualSessions = useManualSessions({
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance
  });

  const handleStartSession = useCallback(async () => {
    // Check if daily limit is reached
    if (userData) {
      const subscription = userData.subscription || 'freemium';
      const dailyLimit = 0.5; // Value for freemium
      const currentGains = balanceManager.getDailyGains();
      
      if (currentGains >= dailyLimit * 0.95) {
        toast({
          title: "Limite quotidienne atteinte",
          description: "Vous avez atteint votre limite quotidienne. Revenez demain ou passez à un forfait supérieur.",
          variant: "destructive",
          duration: 4000
        });
        setShowLimitAlert(true);
        return;
      }
    }
    
    if (manualSessions.isSessionRunning) {
      toast({
        title: "Session déjà en cours",
        description: "Veuillez patienter...",
        duration: 3000
      });
      return;
    }

    setIsStartingSession(true);
    
    try {
      // Record session timestamp
      setLastSessionTimestamp(Date.now());
      
      // Start session
      await manualSessions.startSession();
      
      // Trigger immediate UI balance update
      const currentBalance = balanceManager.getCurrentBalance();
      window.dispatchEvent(new CustomEvent('balance:force-update', {
        detail: { 
          newBalance: currentBalance,
          timestamp: Date.now(), 
          animate: true 
        }
      }));
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la session.",
        variant: "destructive"
      });
    } finally {
      setIsStartingSession(false);
    }
  }, [manualSessions, setShowLimitAlert, userData]);

  const handleWithdrawal = useCallback(async () => {
    if (!userData) return;
    
    // Check if balance is sufficient for withdrawal
    const currentBalance = userData.balance || 0;
    if (currentBalance <= 0) {
      toast({
        title: "Retrait impossible",
        description: "Votre solde est insuffisant pour effectuer un retrait.",
        variant: "destructive"
      });
      return;
    }
    
    // Confirm withdrawal request
    const isConfirmed = window.confirm(
      `Êtes-vous sûr de vouloir retirer ${currentBalance.toFixed(2)}€ de votre compte?`
    );
    
    if (!isConfirmed) return;
    
    try {
      // Perform withdrawal (reset balance)
      await resetBalance();
      
      // Reset local balance manager
      balanceManager.forceBalanceSync(0);
      
      // Force UI update
      window.dispatchEvent(new CustomEvent('balance:force-update', {
        detail: { 
          newBalance: 0,
          timestamp: Date.now(), 
          animate: false 
        }
      }));
      
      toast({
        title: "Retrait demandé",
        description: `Votre demande de retrait de ${currentBalance.toFixed(2)}€ a été enregistrée.`,
        duration: 5000
      });
    } catch (error) {
      console.error("Error during withdrawal request:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter votre demande de retrait.",
        variant: "destructive"
      });
    }
  }, [userData, resetBalance]);

  return {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp,
    isBotActive
  };
};

export default useDashboardSessions;
