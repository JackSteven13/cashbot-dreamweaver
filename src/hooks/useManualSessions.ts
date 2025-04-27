
import { useState, useCallback, useRef, useEffect } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { calculateSessionGain } from '@/utils/sessions/sessionCalculator';
import { useBotStatus } from '@/hooks/useBotStatus';
import { useSessionAnimations } from '@/hooks/sessions/animations/useSessionAnimations';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';

// Fonction utilitaire stricte pour vérifier si la limite est atteinte
const isDailyLimitStrictlyReached = (subscription: string, currentGains: number): boolean => {
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  // Application stricte de la limite à 100% exactement
  return currentGains >= dailyLimit;
};

// Fonction utilitaire stricte pour ajouter un gain quotidien avec vérification
const addDailyGainStrict = (gain: number, subscription: string): boolean => {
  // Obtenir les gains actuels avant d'essayer d'ajouter
  const currentGains = balanceManager.getDailyGains();
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Vérifier si l'ajout dépasserait la limite
  if (currentGains + gain > dailyLimit) {
    console.error(`BLOCAGE STRICT: Gain de ${gain}€ refusé. Total serait ${currentGains + gain}€ > limite ${dailyLimit}€`);
    return false;
  }
  
  // Procéder avec l'ajout uniquement si nous sommes sous la limite
  return balanceManager.addDailyGain(gain);
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

  // Vérifier si la limite quotidienne est atteinte
  useEffect(() => {
    if (userData) {
      // Pour les comptes freemium, vérification stricte de la limite journalière
      if (userData.subscription === 'freemium') {
        const userId = userData.id || userData.profile?.id;
        const limitReachedKey = userId ? `freemium_daily_limit_reached_${userId}` : 'freemium_daily_limit_reached';
        const lastSessionDate = localStorage.getItem('last_session_date');
        const today = new Date().toDateString();
        
        // Vérifier si la limite est atteinte selon le localStorage
        if (dailySessionCount >= 1) {
          setLimitReached(true);
          localStorage.setItem(limitReachedKey, 'true');
          localStorage.setItem('last_session_date', today);
        } else if (lastSessionDate === today && localStorage.getItem(limitReachedKey) === 'true') {
          setLimitReached(true);
        } else if (lastSessionDate !== today) {
          // Si c'est un nouveau jour, réinitialiser la limite
          setLimitReached(false);
          localStorage.removeItem(limitReachedKey);
        }
      }
      
      // Vérification RENFORCÉE avec balanceManager pour tous les types d'abonnements
      if (userData && userData.id) {
        // S'assurer que balanceManager utilise le bon ID
        balanceManager.setUserId(userData.id);
        
        // Vérifier si la limite quotidienne est strictement atteinte
        const currentGains = balanceManager.getDailyGains();
        const subscription = userData.subscription || 'freemium';
        
        if (isDailyLimitStrictlyReached(subscription, currentGains)) {
          console.log(`Limite quotidienne strictement atteinte pour ${userData.id}: ${currentGains}€`);
          setLimitReached(true);
          
          // Marquer comme limite atteinte dans localStorage aussi
          const userId = userData.id;
          localStorage.setItem(`daily_limit_reached_${userId}`, 'true');
          localStorage.setItem(`last_session_date_${userId}`, new Date().toDateString());
        }
      }
    }
  }, [userData, dailySessionCount]);

  // RENFORCÉ: Écoute des événements indiquant que la limite est atteinte
  useEffect(() => {
    const handleLimitReached = (event: Event) => {
      const customEvent = event as CustomEvent;
      const userId = customEvent.detail?.userId;
      
      // Ne réagir qu'aux événements concernant l'utilisateur actuel
      if (userData && (userId === userData.id || userId === userData.profile?.id)) {
        console.log("Event 'daily-limit:reached' détecté pour cet utilisateur");
        setLimitReached(true);
        
        // Désactiver le bot automatique si actif
        window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
          detail: { active: false, reason: 'limit_reached' } 
        }));
      }
    };
    
    window.addEventListener('daily-limit:reached', handleLimitReached as EventListener);
    
    return () => {
      window.removeEventListener('daily-limit:reached', handleLimitReached as EventListener);
    };
  }, [userData]);

  const canStartSession = useCallback(() => {
    if (isSessionRunning) {
      return false;
    }
    
    if (limitReached) {
      console.log("Session bloquée: limite quotidienne déjà atteinte");
      return false;
    }
    
    const now = Date.now();
    const timeSinceLastSession = now - lastSessionRef.current;
    const minDelay = 30000; // 30 secondes minimum entre les sessions
    
    if (timeSinceLastSession < minDelay) {
      console.log("Session bloquée: délai minimum entre sessions non respecté");
      return false;
    }
    
    // Pour les comptes freemium, vérification TRÈS stricte
    if (userData && userData.subscription === 'freemium') {
      // Vérifier si la limite journalière a déjà été enregistrée pour cet utilisateur
      const userId = userData.id || userData.profile?.id;
      const limitReachedKey = userId ? `freemium_daily_limit_reached_${userId}` : 'freemium_daily_limit_reached';
      const limitReached = localStorage.getItem(limitReachedKey);
      const lastSessionDate = localStorage.getItem('last_session_date'); 
      const today = new Date().toDateString();
      
      // Si ce n'est pas un nouveau jour et que la limite est atteinte
      if (lastSessionDate === today && (limitReached === 'true' || dailySessionCount >= 1)) {
        console.log("Session bloquée: limite freemium de 1 session/jour atteinte");
        return false;
      }
    }
    
    // RENFORCÉ: Vérification directe avec balanceManager
    if (userData) {
      const subscription = userData.subscription || 'freemium';
      const currentGains = balanceManager.getDailyGains();
      
      // Utilisation de la fonction utilitaire stricte
      if (isDailyLimitStrictlyReached(subscription, currentGains)) {
        console.log(`Session bloquée: limite quotidienne de gains strictement atteinte (${currentGains}€)`);
        return false;
      }
    }
    
    return true;
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
    
    // RENFORCÉ: Double vérification avant de commencer
    if (!canStartSession()) {
      const subscription = userData.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const currentGains = balanceManager.getDailyGains();
      
      if (isDailyLimitStrictlyReached(subscription, currentGains)) {
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
      
      // RENFORCÉ: Triple vérification avec données actuelles
      const currentDailyGains = balanceManager.getDailyGains();
      const subscription = userData.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Vérification TRÈS stricte que la limite n'est pas déjà atteinte
      if (isDailyLimitStrictlyReached(subscription, currentDailyGains)) {
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
        // Calculer un gain qui ne dépassera jamais la limite (max 90% du reste disponible)
        gain = Math.min(Math.random() * 0.05 + 0.1, remainingAllowance * 0.9);
      } else {
        // Pour les autres abonnements, utiliser la fonction standard mais vérifier la limite
        const calculatedGain = calculateSessionGain(
          userData.subscription, 
          currentDailyGains,
          userData.referrals?.length || 0
        );
        // Limiter strictement le gain à 90% de ce qui reste disponible
        gain = Math.min(calculatedGain, remainingAllowance * 0.9);
      }
      
      // S'assurer que le gain est toujours positif mais ne dépasse pas la limite
      gain = Math.max(0.01, Math.min(gain, remainingAllowance * 0.9));
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
      
      // RENFORCÉ: Utiliser notre fonction utilitaire stricte pour vérifier et ajouter le gain
      if (!addDailyGainStrict(gain, subscription)) {
        console.error("Gain quotidien rejeté par la vérification stricte");
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
      
      // RENFORCÉ: Vérifier une dernière fois que les gains quotidiens sont bien mis à jour
      const updatedDailyGains = balanceManager.getDailyGains();
      console.log(`Gains quotidiens après la session: ${updatedDailyGains}€/${dailyLimit}€`);
      
      // Si après cette session nous atteignons la limite, marquer comme limite atteinte
      if (isDailyLimitStrictlyReached(subscription, updatedDailyGains)) {
        console.log("Limite quotidienne atteinte après cette session");
        setLimitReached(true);
        if (userId) {
          localStorage.setItem(`daily_limit_reached_${userId}`, 'true');
          localStorage.setItem(`last_session_date_${userId}`, new Date().toDateString());
        }
      }
      
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
