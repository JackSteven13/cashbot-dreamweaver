
import { useState } from 'react';
import { useSessionValidation } from './useSessionValidation';
import { UserData } from '@/types/userData';
import { useToast } from '@/components/ui/use-toast';
import balanceManager from '@/utils/balance/balanceManager';
import { triggerDashboardEvent } from '@/utils/animations';
import { calculateSessionGain, generateSessionReport } from '@/utils/sessions';

interface UseManualSessionsProps {
  userData: UserData | null;
  dailySessionCount: number;
  incrementSessionCount: () => Promise<void>;
  updateBalance: (gain: number, report: string) => Promise<void>;
}

export const useManualSessions = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance
}: UseManualSessionsProps) => {
  const { toast } = useToast();
  const [isSessionRunning, setIsSessionRunning] = useState(false);

  // Session validation
  const { canStartSession, sessionErrors, isLimitReached } = useSessionValidation(
    userData || {},
    dailySessionCount
  );

  // Calculate session gain based on subscription
  const calculateManualSessionGain = async (): Promise<number> => {
    const subscription = userData?.subscription || 'freemium';
    return calculateSessionGain(subscription);
  };

  const startSession = async () => {
    if (isSessionRunning) return;

    try {
      setIsSessionRunning(true);

      // Simulate analysis process with animations
      triggerDashboardEvent('analysis-start', {
        subscription: userData?.subscription,
        animate: true
      });

      // Random duration between 2-5 seconds
      const duration = 2000 + Math.random() * 3000;
      await new Promise(resolve => setTimeout(resolve, duration));

      const sessionGain = await calculateManualSessionGain();
      
      // Add to daily gains
      balanceManager.addDailyGain(sessionGain);
      
      // Update session count
      await incrementSessionCount();
      
      // Update balance
      await updateBalance(sessionGain, generateSessionReport('Manuel', userData?.subscription));
      
      // Trigger successful completion animation
      triggerDashboardEvent('analysis-complete', {
        gain: sessionGain,
        animate: true
      });

      toast({
        title: "Session terminée",
        description: `Vous avez gagné ${sessionGain.toFixed(2)}€`,
      });

      return { success: true, finalGain: sessionGain };
    } catch (error) {
      console.error("Erreur lors de la session:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la session",
        variant: "destructive"
      });
    } finally {
      setIsSessionRunning(false);
    }
  };

  return {
    isSessionRunning,
    startSession,
    canStartSession,
    sessionErrors,
    isLimitReached
  };
};
