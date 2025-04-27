
import { useState, useCallback, useRef, useEffect } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { calculateSessionGain } from '@/utils/sessions/sessionCalculator';
import { useBotStatus } from '@/hooks/useBotStatus';
import { useSessionAnimations } from '@/hooks/sessions/animations/useSessionAnimations';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';

const addDailyGain = (gain: number): boolean => {
  // RENFORCÉ: Utiliser directement balanceManager pour la limite stricte
  return balanceManager.addDailyGain(gain);
};

const getDailyGains = (): number => {
  // RENFORCÉ: Utiliser directement balanceManager comme source unique de vérité
  return balanceManager.getDailyGains();
};

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
  const [limitReached, setLimitReached] = useState(false);
  
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSessionRef = useRef<number>(0);

  // Vérifier si la limite quotidienne est atteinte pour les comptes freemium
  useEffect(() => {
    if (userData && userData.subscription === 'freemium') {
      // Pour les comptes freemium, la limite est STRICTEMENT de 1 session par jour
      const userId = userData.id || userData.profile?.id;
      const limitReachedKey = userId ? `freemium_daily_limit_reached_${userId}` : 'freemium_daily_limit_reached';
      const limitReachedValue = localStorage.getItem(limitReachedKey);
      const lastSessionDate = localStorage.getItem('last_session_date');
      const today = new Date().toDateString();
      
      if (dailySessionCount >= 1) {
        setLimitReached(true);
        localStorage.setItem(limitReachedKey, 'true');
        localStorage.setItem('last_session_date', today);
      } else if (lastSessionDate === today && limitReachedValue === 'true') {
        setLimitReached(true);
      } else if (lastSessionDate !== today) {
        // Si c'est un nouveau jour, réinitialiser la limite
        setLimitReached(false);
        localStorage.removeItem(limitReachedKey);
      }
      
      // RENFORCÉ: Vérifier aussi la limite de gains quotidiens via balanceManager
      const dailyLimit = SUBSCRIPTION_LIMITS['freemium'] || 0.5;
      const currentDailyGains = balanceManager.getDailyGains();
      
      if (currentDailyGains >= dailyLimit) {
        setLimitReached(true);
        localStorage.setItem(limitReachedKey, 'true');
      }
    }
  }, [userData, dailySessionCount]);

  // RENFORCÉ: Écoute des événements de limite atteinte
  useEffect(() => {
    const handleLimitReached = () => {
      console.log("Event 'daily-limit:reached' détecté dans useManualSessions");
      setLimitReached(true);
    };
    
    window.addEventListener('daily-limit:reached' as any, handleLimitReached);
    
    return () => {
      window.removeEventListener('daily-limit:reached' as any, handleLimitReached);
    };
  }, []);

  const canStartSession = useCallback(() => {
    if (isSessionRunning) {
      return false;
    }
    
    if (limitReached) {
      return false;
    }
    
    const now = Date.now();
    const timeSinceLastSession = now - lastSessionRef.current;
    const minDelay = 30000;
    
    if (timeSinceLastSession < minDelay) {
      return false;
    }
    
    // Pour les comptes freemium, vérifier STRICTEMENT la limite de 1 session par jour
    if (userData && userData.subscription === 'freemium') {
      // Vérifier si la limite journalière a déjà été enregistrée
      const userId = userData.id || userData.profile?.id;
      const limitReachedKey = userId ? `freemium_daily_limit_reached_${userId}` : 'freemium_daily_limit_reached';
      const limitReached = localStorage.getItem(limitReachedKey);
      const lastSessionDate = localStorage.getItem('last_session_date'); 
      const today = new Date().toDateString();
      
      // Si ce n'est pas un nouveau jour et que la limite est atteinte
      if (lastSessionDate === today && (limitReached === 'true' || dailySessionCount >= 1)) {
        return false;
      }
    }
    
    // RENFORCÉ: Vérifier si la limite quotidienne de gains est atteinte via balanceManager
    const subscription = userData?.subscription || 'freemium';
    return !balanceManager.isDailyLimitReached(subscription);
  }, [isSessionRunning, userData, dailySessionCount, limitReached]);

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
    
    // RENFORCÉ: Vérification avant de commencer la session
    if (!canStartSession()) {
      const subscription = userData.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const currentGains = balanceManager.getDailyGains();
      
      if (currentGains >= dailyLimit) {
        toast({
          title: "Limite journalière atteinte",
          description: `Vous avez atteint votre limite quotidienne de ${dailyLimit}€.`,
          variant: "destructive",
          duration: 4000
        });
      } else if (userData.subscription === 'freemium' && dailySessionCount >= 1) {
        toast({
          title: "Limite quotidienne atteinte",
          description: "Les comptes freemium sont limités à 1 session par jour.",
          variant: "destructive",
          duration: 3000
        });
      } else {
        toast({
          title: "Session non disponible",
          description: "Veuillez attendre avant de démarrer une nouvelle session.",
          duration: 3000
        });
      }
      return;
    }
    
    try {
      setIsSessionRunning(true);
      lastSessionRef.current = Date.now();
      console.log("Démarrage de la session manuelle");
      
      startAnimation();
      
      const userId = userData.id || userData.profile?.id;
      if (userId) {
        // S'assurer que balanceManager utilise le bon ID utilisateur
        balanceManager.setUserId(userId);
      }
      
      const currentDailyGains = balanceManager.getDailyGains();
      const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // RENFORCÉ: Vérification stricte que la limite n'est pas atteinte
      if (currentDailyGains >= dailyLimit) {
        toast({
          title: "Limite journalière atteinte",
          description: `Vous avez déjà généré ${currentDailyGains.toFixed(2)}€ aujourd'hui, atteignant la limite de ${dailyLimit}€.`,
          variant: "destructive",
          duration: 5000
        });
        setIsSessionRunning(false);
        stopAnimation();
        return;
      }
      
      const simulationTime = Math.random() * 1500 + 1500;
      
      // Calculer un gain qui respecte strictement la limite
      const remainingAllowance = dailyLimit - currentDailyGains;
      
      // Pour les comptes freemium, limite stricte sur le gain
      let gain = 0;
      if (userData.subscription === 'freemium') {
        // Calculer un gain qui ne dépassera jamais la limite
        gain = Math.min(Math.random() * 0.05 + 0.1, remainingAllowance * 0.95);
      } else {
        // Pour les autres abonnements, utiliser la fonction standard mais vérifier la limite
        const calculatedGain = calculateSessionGain(
          userData.subscription, 
          currentDailyGains,
          userData.referrals?.length || 0
        );
        gain = Math.min(calculatedGain, remainingAllowance * 0.95);
      }
      
      // S'assurer que le gain est toujours positif mais ne dépasse pas la limite
      gain = Math.max(0.01, Math.min(gain, remainingAllowance * 0.95));
      gain = parseFloat(gain.toFixed(2));
      
      console.log(`Gain calculé: ${gain}€ (limite restante: ${remainingAllowance}€)`);
      
      // Pour les comptes freemium, marquer immédiatement que la limite est atteinte après une session
      if (userData.subscription === 'freemium') {
        setLimitReached(true);
        if (userId) {
          localStorage.setItem(`freemium_daily_limit_reached_${userId}`, 'true');
        } else {
          localStorage.setItem('freemium_daily_limit_reached', 'true');
        }
        localStorage.setItem('last_session_date', new Date().toDateString());
      }
      
      await new Promise(resolve => {
        sessionTimeoutRef.current = setTimeout(resolve, simulationTime);
      });
      
      // RENFORCÉ: Utiliser addDailyGain d'abord pour vérifier si le gain peut être ajouté
      if (!addDailyGain(gain)) {
        console.error("Impossible d'ajouter le gain quotidien, la limite a été atteinte");
        toast({
          title: "Limite quotidienne atteinte",
          description: `Votre limite de gain quotidien de ${dailyLimit}€ a été atteinte.`,
          variant: "destructive",
          duration: 4000
        });
        setIsSessionRunning(false);
        stopAnimation();
        return;
      }
      
      const oldBalance = balanceManager.getCurrentBalance();
      
      // RENFORCÉ: N'appliquer la mise à jour du solde que si la limite n'est pas dépassée
      const balanceUpdated = balanceManager.updateBalance(gain);
      if (!balanceUpdated) {
        console.error("Mise à jour du solde rejetée par balanceManager");
        toast({
          title: "Erreur de mise à jour",
          description: "Impossible de mettre à jour votre solde. Limite quotidienne peut-être atteinte.",
          variant: "destructive",
          duration: 4000
        });
        setIsSessionRunning(false);
        stopAnimation();
        return;
      }
      
      const newBalance = balanceManager.getCurrentBalance();
      
      const sessionReport = `Session manuelle #${dailySessionCount + 1}: ${gain.toFixed(2)}€ générés.`;
      
      await updateBalance(gain, sessionReport, true);
      
      await incrementSessionCount();
      
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: gain,
          oldBalance: oldBalance,
          newBalance: newBalance,
          animate: true,
          duration: 1500
        }
      }));
      
      // Assurer que tout le monde est informé de la mise à jour
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('balance:force-update', {
          detail: {
            amount: gain,
            currentBalance: newBalance,
            oldBalance: oldBalance,
            newBalance: newBalance,
            animate: true
          }
        }));
      }, 100);
      
      toast({
        title: "Session terminée",
        description: `Vous avez gagné ${gain.toFixed(2)}€`,
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
    startAnimation,
    stopAnimation,
    updateBalance,
    incrementSessionCount
  ]);

  return {
    isSessionRunning,
    startSession,
    canStartSession: canStartSession(),
    limitReached
  };
};

export default useManualSessions;
