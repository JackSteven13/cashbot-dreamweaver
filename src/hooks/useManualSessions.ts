
import { useState, useCallback, useRef, useEffect } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { calculateSessionGain } from '@/utils/sessions/sessionCalculator';
import { useBotStatus } from '@/hooks/useBotStatus';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';

// Fonction utilitaire pour vérifier si la limite est strictement atteinte
const isDailyLimitReached = (subscription: string, currentGains: number): boolean => {
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  return currentGains >= dailyLimit;
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
  const { isBotActive } = useBotStatus();
  const [limitReached, setLimitReached] = useState(false);
  
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSessionRef = useRef<number>(0);
  const processingRef = useRef<boolean>(false);

  // Vérifier si la limite quotidienne est atteinte
  useEffect(() => {
    if (!userData) return;
    
    const checkIfLimitReached = () => {
      // Pour les comptes freemium, vérification stricte de la limite journalière
      if (userData.subscription === 'freemium') {
        const userId = userData.id;
        const limitReachedKey = userId ? `freemium_daily_limit_reached_${userId}` : 'freemium_daily_limit_reached';
        const lastSessionDate = localStorage.getItem('last_session_date');
        const today = new Date().toDateString();
        
        // Vérifier si la limite est atteinte selon le localStorage
        if (dailySessionCount >= 1) {
          setLimitReached(true);
          localStorage.setItem(limitReachedKey, 'true');
          localStorage.setItem('last_session_date', today);
          return true;
        } else if (lastSessionDate === today && localStorage.getItem(limitReachedKey) === 'true') {
          setLimitReached(true);
          return true;
        }
      }
      
      // Vérification avec balanceManager pour tous les types d'abonnements
      if (userData.id) {
        // S'assurer que balanceManager utilise le bon ID
        balanceManager.setUserId(userData.id);
        
        // Vérifier si la limite quotidienne est strictement atteinte
        const currentGains = balanceManager.getDailyGains();
        const subscription = userData.subscription || 'freemium';
        
        if (isDailyLimitReached(subscription, currentGains)) {
          setLimitReached(true);
          
          // Marquer comme limite atteinte dans localStorage aussi
          const userId = userData.id;
          localStorage.setItem(`daily_limit_reached_${userId}`, 'true');
          localStorage.setItem(`last_session_date_${userId}`, new Date().toDateString());
          return true;
        }
      }
      
      return false;
    };
    
    const isLimitReached = checkIfLimitReached();
    setLimitReached(isLimitReached);
    
    // Écouter l'événement de limite atteinte
    const handleLimitReached = () => {
      setLimitReached(true);
    };
    
    window.addEventListener('daily-limit:reached', handleLimitReached);
    
    return () => {
      window.removeEventListener('daily-limit:reached', handleLimitReached);
    };
  }, [userData, dailySessionCount]);

  const canStartSession = useCallback(() => {
    // Si une session est déjà en cours, bloquer
    if (isSessionRunning || processingRef.current) {
      return false;
    }
    
    // Si la limite est atteinte, bloquer
    if (limitReached) {
      return false;
    }
    
    // S'assurer qu'on attend au moins 5 secondes entre les sessions
    const now = Date.now();
    const timeSinceLastSession = now - lastSessionRef.current;
    const minDelay = 5000; // 5 secondes minimum entre les sessions
    
    if (timeSinceLastSession < minDelay) {
      return false;
    }
    
    // Pour les comptes freemium, limiter à 1 session par jour
    if (userData && userData.subscription === 'freemium' && dailySessionCount >= 1) {
      return false;
    }
    
    // Vérifier les limites quotidiennes
    if (userData) {
      const subscription = userData.subscription || 'freemium';
      const currentGains = balanceManager.getDailyGains();
      
      if (isDailyLimitReached(subscription, currentGains)) {
        return false;
      }
    }
    
    return true;
  }, [isSessionRunning, userData, dailySessionCount, limitReached]);

  const startSession = useCallback(async () => {
    console.log("useManualSessions: startSession called");
    
    // Double vérification pour éviter les démarrages multiples
    if (processingRef.current) {
      console.log("Session déjà en cours de traitement, ignorée");
      return;
    }
    
    if (!userData) {
      toast({
        title: "Session non disponible",
        description: "Données utilisateur non disponibles.",
        duration: 3000
      });
      return;
    }
    
    // Vérifier si on peut démarrer une session
    if (!canStartSession()) {
      if (limitReached) {
        const subscription = userData.subscription || 'freemium';
        const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
        
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
      // Marquer comme en cours de traitement avec plusieurs mécanismes pour éviter les doublons
      setIsSessionRunning(true);
      processingRef.current = true;
      lastSessionRef.current = Date.now();
      
      // Émettre un événement pour informer les autres composants
      window.dispatchEvent(new CustomEvent('session:start', { 
        detail: { 
          manual: true,
          timestamp: Date.now() 
        }
      }));
      
      // Vérifications de sécurité
      const subscription = userData.subscription || 'freemium';
      const currentGains = balanceManager.getDailyGains();
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Vérifier une dernière fois la limite
      if (isDailyLimitReached(subscription, currentGains)) {
        toast({
          title: "Limite journalière atteinte",
          description: `Vous avez déjà généré ${currentGains.toFixed(2)}€ aujourd'hui, atteignant la limite de ${dailyLimit}€.`,
          variant: "destructive",
          duration: 5000
        });
        setIsSessionRunning(false);
        processingRef.current = false;
        return;
      }
      
      // Calculer le gain en fonction de l'abonnement et des limites
      const remainingAllowance = dailyLimit - currentGains;
      let gain = 0;
      
      if (subscription === 'freemium') {
        // Gain fixe pour les comptes freemium (entre 0.2€ et 0.3€)
        gain = Math.min(0.2 + Math.random() * 0.1, remainingAllowance);
      } else {
        // Pour les autres comptes, gain plus élevé mais toujours dans la limite
        gain = Math.min(0.3 + Math.random() * 0.2, remainingAllowance);
      }
      
      // Arrondir à 2 décimales
      gain = parseFloat(gain.toFixed(2));
      
      console.log(`Gain calculé: ${gain}€ (limite restante: ${remainingAllowance}€)`);
      
      // Simulation d'un traitement (2-3 secondes)
      await new Promise(resolve => {
        const simulationTime = 2000 + Math.random() * 1000;
        sessionTimeoutRef.current = setTimeout(resolve, simulationTime);
      });
      
      // Mettre à jour le solde
      balanceManager.addDailyGain(gain);
      const oldBalance = balanceManager.getCurrentBalance();
      balanceManager.updateBalance(gain);
      const newBalance = balanceManager.getCurrentBalance();
      
      // Rapport de session
      const sessionReport = `Session manuelle #${dailySessionCount + 1}: ${gain.toFixed(2)}€ générés.`;
      
      // Mettre à jour le solde et incrémenter le compteur
      await updateBalance(gain, sessionReport, true);
      await incrementSessionCount();
      
      // Pour les comptes freemium, marquer comme limite atteinte après une session
      if (subscription === 'freemium') {
        setLimitReached(true);
        const userId = userData.id;
        if (userId) {
          localStorage.setItem(`freemium_daily_limit_reached_${userId}`, 'true');
          localStorage.setItem('last_session_date', new Date().toDateString());
        }
      }
      
      // Si après cette session nous atteignons la limite, marquer comme limite atteinte
      const updatedGains = balanceManager.getDailyGains();
      if (isDailyLimitReached(subscription, updatedGains)) {
        setLimitReached(true);
        const userId = userData.id;
        if (userId) {
          localStorage.setItem(`daily_limit_reached_${userId}`, 'true');
          localStorage.setItem(`last_session_date_${userId}`, new Date().toDateString());
        }
        
        // Déclencher un événement pour informer les autres composants
        window.dispatchEvent(new CustomEvent('daily-limit:reached', {
          detail: {
            subscription,
            limit: dailyLimit,
            currentGains: updatedGains,
            userId: userData.id
          }
        }));
      }
      
      // Déclencher une animation de mise à jour du solde
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: gain,
          oldBalance,
          newBalance,
          animate: true,
          duration: 1500
        }
      }));
      
      // Informer aussi avec un événement session:completed
      window.dispatchEvent(new CustomEvent('session:completed', {
        detail: {
          gain,
          timestamp: Date.now(),
          userId: userData.id
        }
      }));
      
      toast({
        title: "Session terminée",
        description: `Vous avez gagné ${gain.toFixed(2)}€`,
        duration: 3000
      });
      
    } catch (error) {
      console.error("Erreur lors de la session manuelle:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue pendant l'analyse.",
        variant: "destructive"
      });
    } finally {
      setIsSessionRunning(false);
      processingRef.current = false;
    }
  }, [
    canStartSession,
    userData,
    dailySessionCount,
    limitReached,
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
