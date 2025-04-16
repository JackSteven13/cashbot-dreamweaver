
import { useState, useCallback } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { calculateSessionGain, generateSessionReport } from '@/utils/sessions';
import { toast } from '@/components/ui/use-toast';
import balanceManager from '@/utils/balance/balanceManager';

interface UseManualSessionsProps {
  userData: any;
  dailySessionCount: number;
  incrementSessionCount: () => Promise<void>;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
}

export const useManualSessions = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance
}: UseManualSessionsProps) => {
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  
  // Check if a session can be started
  const canStartSession = useCallback(() => {
    if (!userData) return false;
    
    // Check subscription limits
    const subscription = userData.subscription || 'freemium';
    const sessionLimit = subscription === 'freemium' ? 1 : 
                          subscription === 'basic' ? 3 :
                          subscription === 'premium' ? 5 : 1;
    
    return dailySessionCount < sessionLimit;
  }, [userData, dailySessionCount]);
  
  // Start a manual session
  const startSession = useCallback(async () => {
    if (isSessionRunning || !userData?.profile?.id) return;
    
    try {
      setIsSessionRunning(true);
      
      // Check if session can be started
      if (!canStartSession()) {
        toast({
          title: 'Limite atteinte',
          description: 'Vous avez atteint votre limite quotidienne de sessions manuelles.',
          variant: 'destructive'
        });
        setIsSessionRunning(false);
        return;
      }
      
      // Generate session gain
      const subscription = userData.subscription || 'freemium';
      const sessionGain = calculateSessionGain(subscription);
      const sessionReport = generateSessionReport('Manuel', subscription);
      
      // Increment session count
      await incrementSessionCount();
      
      // Show success toast
      toast({
        title: 'Session démarrée',
        description: `Une session d'analyse a été démarrée avec succès. Gain: ${sessionGain.toFixed(2)}€`,
        variant: 'default'
      });
      
      // Update balance with session gain
      await updateBalance(sessionGain, sessionReport, true);
      
      // Update balance manager
      balanceManager.updateBalance(sessionGain);
      
      // Trigger UI update event
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: sessionGain,
          currentBalance: balanceManager.getCurrentBalance(),
          animate: true
        }
      }));
      
      // Reset UI state after a delay
      setTimeout(() => {
        setIsSessionRunning(false);
      }, 1500);
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du démarrage de la session.',
        variant: 'destructive'
      });
      setIsSessionRunning(false);
    }
  }, [userData, canStartSession, incrementSessionCount, updateBalance, isSessionRunning]);
  
  return {
    isSessionRunning,
    startSession,
    canStartSession: canStartSession()
  };
};

export default useManualSessions;
