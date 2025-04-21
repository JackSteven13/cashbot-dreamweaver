import { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { resetUserBalance } from '@/utils/balance/resetBalance';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { canStartManualSession, SessionStartResult } from '@/utils/subscription/sessionManagement';
import { calculateManualSessionGain } from '@/utils/subscription/sessionGain';
import { simulateActivity } from '@/utils/animations/moneyParticles';
import balanceManager from '@/utils/balance/balanceManager';

interface UseDashboardSessionsProps {
  userData: any;
  dailySessionCount: number;
  incrementSessionCount: () => Promise<void>;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  setShowLimitAlert: React.Dispatch<React.SetStateAction<boolean>>;
  resetBalance: () => Promise<void>;
}

interface UseDashboardSessionsResult {
  isStartingSession: boolean;
  handleStartSession: () => Promise<void>;
  handleWithdrawal: () => Promise<void>;
  lastSessionTimestamp: number | null;
  isBotActive: boolean;
  toggleBotActive?: () => void;
}

export const useDashboardSessions = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance,
  setShowLimitAlert,
  resetBalance
}: UseDashboardSessionsProps): UseDashboardSessionsResult => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [lastSessionTimestamp, setLastSessionTimestamp] = useState<number | null>(() => {
    const stored = localStorage.getItem('lastSessionTimestamp');
    return stored ? parseInt(stored, 10) : null;
  });
  const [isBotActive, setIsBotActive] = useState(true);
  
  const sessionInProgressRef = useRef(false);
  const withdrawalInProgressRef = useRef(false);
  const sessionCountRef = useRef(dailySessionCount);
  
  useEffect(() => {
    sessionCountRef.current = dailySessionCount;
  }, [dailySessionCount]);

  const handleStartSession = async () => {
    if (sessionInProgressRef.current || isStartingSession) {
      return;
    }
    
    try {
      sessionInProgressRef.current = true;
      setIsStartingSession(true);
      
      const currentDailyGains = balanceManager.getDailyGains();
      
      console.log("Attempting to start session with daily gains:", currentDailyGains);
      
      const result = canStartManualSession(
        userData?.subscription || 'freemium',
        sessionCountRef.current,
        currentDailyGains
      );
      
      if (!result.canStart) {
        toast({
          title: "Session impossible",
          description: result.reason || "Vous ne pouvez pas démarrer de session maintenant.",
          variant: "destructive"
        });
        
        const now = Date.now();
        localStorage.setItem('lastSessionTimestamp', now.toString());
        setLastSessionTimestamp(now);
        
        return;
      }
      
      const terminalSequence = createBackgroundTerminalSequence([
        "Initialisation de la session d'analyse manuelle..."
      ]);
      
      window.dispatchEvent(new CustomEvent('session:start', { detail: { manual: true } }));
      simulateActivity();
      
      terminalSequence.add("Analyse des données en cours...");
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      terminalSequence.add("Optimisation des résultats...");
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const gain = calculateManualSessionGain(
        userData?.subscription || 'freemium',
        currentDailyGains,
        userData?.referrals?.length || 0
      );
      
      const now = Date.now();
      localStorage.setItem('lastSessionTimestamp', now.toString());
      setLastSessionTimestamp(now);
      
      await incrementSessionCount();
      
      terminalSequence.add(`Résultats optimisés! Gain: ${gain.toFixed(2)}€`);
      
      balanceManager.addDailyGain(gain);
      
      await updateBalance(gain, `Session d'analyse manuelle: +${gain.toFixed(2)}€`);
      
      terminalSequence.complete(gain);
      
      window.dispatchEvent(new CustomEvent('transactions:refresh'));
      
      toast({
        title: "Session complétée",
        description: `Votre session a généré ${gain.toFixed(2)}€`,
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la session.",
        variant: "destructive"
      });
    } finally {
      setIsStartingSession(false);
      sessionInProgressRef.current = false;
    }
  };

  const handleWithdrawal = async () => {
    if (withdrawalInProgressRef.current) {
      return;
    }
    
    try {
      withdrawalInProgressRef.current = true;
      
      if (!userData?.balance || userData.balance < 10) {
        toast({
          title: "Retrait impossible",
          description: "Vous devez avoir au moins 10€ pour effectuer un retrait.",
          variant: "destructive"
        });
        return;
      }
      
      if (!window.confirm(`Êtes-vous sûr de vouloir retirer ${userData.balance.toFixed(2)}€ sur votre compte bancaire?`)) {
        return;
      }
      
      if (userData?.profile?.id) {
        const result = await resetUserBalance(userData.profile.id, userData.balance);
        
        if (result.success) {
          await resetBalance();
          
          toast({
            title: "Retrait effectué",
            description: `${userData.balance.toFixed(2)}€ ont été retirés avec succès. Le transfert sera visible sur votre compte bancaire sous 1 à 3 jours ouvrés.`,
          });
        } else {
          throw new Error("Le retrait a échoué");
        }
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du traitement du retrait.",
        variant: "destructive"
      });
    } finally {
      withdrawalInProgressRef.current = false;
    }
  };
  
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const active = event.detail?.active;
      if (typeof active === 'boolean') {
        setIsBotActive(active);
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
    };
  }, []);
  
  return {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp,
    isBotActive
  };
};

export default useDashboardSessions;
