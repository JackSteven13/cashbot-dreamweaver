
import { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { resetUserBalance } from '@/utils/balance/resetBalance';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { canStartManualSession } from '@/utils/subscription/sessionManagement';
import { MANUAL_SESSION_GAIN_PERCENTAGES } from '@/utils/subscription/constants';
import { simulateActivity } from '@/utils/animations/moneyParticles';

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

// Define the return type for canStartManualSession to match the implementation
interface SessionStartResult {
  canStart: boolean;
  reason?: string;
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
  const [lastSessionTimestamp, setLastSessionTimestamp] = useState<number | null>(null);
  const [isBotActive, setIsBotActive] = useState(true);
  
  const sessionInProgressRef = useRef(false);
  const withdrawalInProgressRef = useRef(false);
  const sessionCountRef = useRef(dailySessionCount);
  
  // Update ref when prop changes
  useEffect(() => {
    sessionCountRef.current = dailySessionCount;
  }, [dailySessionCount]);

  const handleStartSession = async () => {
    // Prevent multiple concurrent sessions
    if (sessionInProgressRef.current || isStartingSession) {
      return;
    }
    
    try {
      sessionInProgressRef.current = true;
      setIsStartingSession(true);
      
      // Check if user can start a manual session
      const canStartResult = canStartManualSession(
        userData?.subscription || 'freemium',
        sessionCountRef.current,
        0 // Pass 0 as the current balance (third parameter)
      ) as SessionStartResult;
      
      if (!canStartResult.canStart) {
        toast({
          title: "Session impossible",
          description: canStartResult.reason || "Vous ne pouvez pas démarrer de session maintenant.",
          variant: "destructive"
        });
        return;
      }
      
      // Start session animation in terminal
      const terminalSequence = createBackgroundTerminalSequence([
        "Initialisation de la session d'analyse manuelle..."
      ]);
      
      // Add visual effects
      window.dispatchEvent(new CustomEvent('session:start', { detail: { manual: true } }));
      simulateActivity();
      
      // Add more terminal messages for realism
      terminalSequence.add("Analyse des données en cours...");
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      terminalSequence.add("Optimisation des résultats...");
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get subscription-based gain percentage
      const gainPercentageObj = MANUAL_SESSION_GAIN_PERCENTAGES[userData?.subscription as keyof typeof MANUAL_SESSION_GAIN_PERCENTAGES] || 
        MANUAL_SESSION_GAIN_PERCENTAGES.freemium;
        
      // Calculate gain with some variance
      const baseGain = gainPercentageObj.min + Math.random() * (gainPercentageObj.max - gainPercentageObj.min);
      const variance = baseGain * 0.2; // 20% variance
      const randomFactor = Math.random() * variance * 2 - variance; // range: -variance to +variance
      const gain = parseFloat((baseGain + randomFactor).toFixed(2));
      
      // Update the session timestamp before incrementing count to prevent double submissions
      setLastSessionTimestamp(Date.now());
      
      // Increment session count
      await incrementSessionCount();
      
      // Add final terminal message before updating balance
      terminalSequence.add(`Résultats optimisés! Gain: ${gain.toFixed(2)}€`);
      
      // Update user balance
      await updateBalance(gain, `Session d'analyse manuelle: +${gain.toFixed(2)}€`);
      
      // Complete terminal sequence
      terminalSequence.complete(gain);
      
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
    // Prevent multiple concurrent withdrawals
    if (withdrawalInProgressRef.current) {
      return;
    }
    
    try {
      withdrawalInProgressRef.current = true;
      
      // Check if user has enough balance to withdraw
      if (!userData?.balance || userData.balance < 10) {
        toast({
          title: "Retrait impossible",
          description: "Vous devez avoir au moins 10€ pour effectuer un retrait.",
          variant: "destructive"
        });
        return;
      }
      
      // Confirm withdrawal
      if (!window.confirm(`Êtes-vous sûr de vouloir retirer ${userData.balance.toFixed(2)}€ sur votre compte bancaire?`)) {
        return;
      }
      
      // Reset the balance in database
      if (userData?.profile?.id) {
        const result = await resetUserBalance(userData.profile.id, userData.balance);
        
        if (result.success) {
          // Reset local balance after successful withdrawal
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
  
  // Listen for bot status changes
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
