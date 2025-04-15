
import { useState, useCallback } from 'react';
import { useSessionValidation } from './useSessionValidation';
import { useLimitChecking } from './useLimitChecking';
import { useSessionGain } from './useSessionGain';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import balanceManager from '@/utils/balance/balanceManager';
import { UserData } from '@/types/userData';

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
  const { user } = useAuth();
  const [isSessionRunning, setIsSessionRunning] = useState(false);

  // Créer un objet userData sécurisé avec toutes les propriétés requises
  const safeUserData: UserData = {
    username: userData?.username || 'User',
    balance: userData?.balance || 0,
    subscription: userData?.subscription || 'freemium',
    transactions: userData?.transactions || [],
    profile: userData?.profile || { id: user?.id || 'unknown' },
    referrals: userData?.referrals || [],
    referralLink: userData?.referralLink || `${window.location.origin}/register?ref=${user?.id || 'unknown'}`
  };

  // Validation de session
  const { canStartSession, sessionErrors } = useSessionValidation(safeUserData, dailySessionCount);

  // Vérification des limites
  const { isLimitReached, currentLimit } = useLimitChecking(safeUserData);

  // Calcul de gain pour la session
  const { calculateSessionGain, getRandomSessionDuration } = useSessionGain(safeUserData);

  const startSession = useCallback(async () => {
    // Vérifications préalables
    if (isSessionRunning) {
      console.log('Session déjà en cours');
      return;
    }

    if (!canStartSession) {
      toast({
        title: "Impossible de démarrer une session",
        description: sessionErrors.join('. '),
        variant: "destructive"
      });
      return;
    }

    if (isLimitReached) {
      toast({
        title: "Limite quotidienne atteinte",
        description: `Vous avez atteint votre limite quotidienne de ${currentLimit}€`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSessionRunning(true);
      
      // Simuler le processus d'analyse
      const sessionDuration = getRandomSessionDuration();
      const startTime = Date.now();
      const endTime = startTime + sessionDuration;

      // Afficher un toast pour indiquer le début de la session
      toast({
        title: "Session démarrée",
        description: "L'analyse est en cours...",
      });

      // Attendre la fin de la session
      await new Promise(resolve => setTimeout(resolve, sessionDuration));

      // Calculer le gain
      const sessionGain = calculateSessionGain();
      
      // Mise à jour du solde quotidien
      balanceManager.addDailyGain(sessionGain);
      
      // Mettre à jour le compteur de sessions
      await incrementSessionCount();
      
      // Mettre à jour le solde utilisateur
      await updateBalance(sessionGain, `Session d'analyse publicitaire`);
      
      // Afficher un toast avec le résultat
      toast({
        title: "Session terminée",
        description: `Vous avez gagné ${sessionGain.toFixed(2)}€`,
      });
      
      return sessionGain;
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
  }, [
    canStartSession, 
    calculateSessionGain, 
    currentLimit, 
    getRandomSessionDuration, 
    incrementSessionCount, 
    isLimitReached, 
    isSessionRunning, 
    sessionErrors, 
    toast, 
    updateBalance
  ]);

  return {
    isSessionRunning,
    startSession,
    canStartSession,
    sessionErrors,
    isLimitReached
  };
};
