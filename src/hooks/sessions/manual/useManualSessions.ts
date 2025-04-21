
import { useState, useCallback, useRef } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { calculateSessionGain } from '@/utils/sessions/sessionCalculator';
import { useBotStatus } from '@/hooks/useBotStatus';
import { useSessionAnimations } from '@/hooks/sessions/animations/useSessionAnimations';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';
import { addTransaction, calculateTodaysGains } from '@/utils/user/transactionUtils';
import { respectsDailyLimit } from '@/utils/subscription/sessionManagement';

interface ManualSessionHookProps {
  userData: UserData | null;
  dailySessionCount: number;
  incrementSessionCount: () => Promise<void>;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
}

export const useManualSessions = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance
}: ManualSessionHookProps) => {
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const { isBotActive, activityLevel } = useBotStatus();
  const { startAnimation, stopAnimation } = useSessionAnimations();
  
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSessionRef = useRef<number>(0);

  const canStartSession = useCallback(() => {
    if (isSessionRunning) {
      return false;
    }
    
    const now = Date.now();
    const timeSinceLastSession = now - lastSessionRef.current;
    const minDelay = 30000;
    
    if (timeSinceLastSession < minDelay) {
      return false;
    }
    
    if (userData && userData.subscription === 'freemium' && dailySessionCount >= 1) {
      return false;
    }
    
    if (userData) {
      // Vérification stricte des limites quotidiennes
      const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const todaysGains = balanceManager.getDailyGains();
      
      if (todaysGains >= dailyLimit * 0.95) {
        return false;
      }
    }
    
    return true;
  }, [isSessionRunning, userData, dailySessionCount]);

  const startSession = useCallback(async () => {
    console.log("useManualSessions: startSession called");
    
    if (!userData) {
      toast({
        title: "Session non disponible",
        description: "Données utilisateur non disponibles.",
        duration: 3000
      });
      return;
    }
    
    if (!canStartSession()) {
      toast({
        title: "Session non disponible",
        description: "Veuillez attendre avant de démarrer une nouvelle session.",
        duration: 3000
      });
      return;
    }
    
    try {
      setIsSessionRunning(true);
      lastSessionRef.current = Date.now();
      console.log("Démarrage de la session manuelle");
      
      startAnimation();
      
      // Vérifier les gains quotidiens actuels depuis la base de données
      const todaysGains = await calculateTodaysGains(userData.id);
      balanceManager.setDailyGains(todaysGains); // Synchroniser avec les données du serveur
      
      const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Vérification stricte que la limite n'est pas atteinte
      if (todaysGains >= dailyLimit * 0.95) {
        toast({
          title: "Limite journalière presque atteinte",
          description: `Vous avez déjà généré ${todaysGains.toFixed(2)}€ aujourd'hui, proche de la limite de ${dailyLimit}€.`,
          variant: "warning",
          duration: 5000
        });
        setIsSessionRunning(false);
        stopAnimation();
        return;
      }
      
      const simulationTime = Math.random() * 1500 + 1500;
      
      let potentialGain = calculateSessionGain(
        userData.subscription, 
        todaysGains, // pass current daily gains for better limit handling
        activityLevel
      );
      
      potentialGain = parseFloat(potentialGain.toFixed(2));
      
      console.log(`Gain potentiel calculé: ${potentialGain}€`);
      
      // Vérifier et ajuster le gain pour respecter strictement la limite quotidienne
      const { allowed, adjustedGain } = respectsDailyLimit(
        userData.subscription,
        todaysGains,
        potentialGain
      );
      
      if (!allowed) {
        toast({
          title: "Limite journalière atteinte",
          description: `Vous avez atteint votre limite quotidienne de ${dailyLimit}€.`,
          variant: "destructive",
          duration: 5000
        });
        setIsSessionRunning(false);
        stopAnimation();
        return;
      }
      
      const finalGain = adjustedGain;
      
      // Attendre la fin de la simulation
      await new Promise(resolve => {
        sessionTimeoutRef.current = setTimeout(resolve, simulationTime);
      });
      
      // Enregistrer la transaction dans la base de données
      const sessionReport = `Session manuelle #${dailySessionCount + 1}: ${finalGain.toFixed(2)}€`;
      const transactionAdded = await addTransaction(userData.id, finalGain, sessionReport);
      
      if (!transactionAdded) {
        console.error("Échec de l'enregistrement de la transaction");
        toast({
          title: "Erreur",
          description: "Problème lors de l'enregistrement de la transaction.",
          variant: "destructive"
        });
        setIsSessionRunning(false);
        stopAnimation();
        return;
      }
      
      // Mettre à jour le solde et les compteurs
      balanceManager.addDailyGain(finalGain);
      balanceManager.updateBalance(finalGain);
      
      const oldBalance = balanceManager.getCurrentBalance() - finalGain;
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: finalGain,
          oldBalance: oldBalance,
          newBalance: balanceManager.getCurrentBalance(),
          animate: true,
          duration: 1500
        }
      }));
      
      await updateBalance(finalGain, sessionReport);
      await incrementSessionCount();
      
      toast({
        title: "Session terminée",
        description: `Vous avez gagné ${finalGain.toFixed(2)}€`,
        duration: 3000
      });
      
      stopAnimation();
      console.log("Fin de la session manuelle");
      
    } catch (error) {
      console.error("Erreur lors de la session manuelle:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue pendant l'analyse.",
        variant: "destructive"
      });
    } finally {
      setIsSessionRunning(false);
    }
  }, [
    canStartSession,
    userData,
    dailySessionCount,
    activityLevel,
    startAnimation,
    stopAnimation,
    updateBalance,
    incrementSessionCount
  ]);

  return {
    isSessionRunning,
    startSession,
    canStartSession: canStartSession()
  };
};

export default useManualSessions;
