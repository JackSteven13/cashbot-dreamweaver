import { useState, useRef, useEffect } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { 
  SUBSCRIPTION_LIMITS, 
  checkDailyLimit, 
  canStartManualSession,
  calculateManualSessionGain,
  getEffectiveSubscription 
} from '@/utils/subscriptionUtils';

export const useManualSessions = (
  userData: UserData,
  dailySessionCount: number,
  incrementSessionCount: () => Promise<void>,
  updateBalance: (gain: number, report: string) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void
) => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const sessionInProgress = useRef(false);
  const operationLock = useRef(false);
  const clickTimeoutRef = useRef<number | null>(null);
  
  // Maintenir une référence locale au solde actuel pour éviter les conditions de concurrence
  const currentBalanceRef = useRef<number>(userData.balance);
  // Ajouter un compteur de boosts pour empêcher les abus
  const boostCountRef = useRef<number>(0);
  const lastBoostTimeRef = useRef<number>(Date.now());

  // Mettre à jour la référence locale au solde lorsque userData change
  useEffect(() => {
    currentBalanceRef.current = userData.balance;
  }, [userData.balance]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Réinitialiser le compteur de boosts toutes les 5 minutes
  useEffect(() => {
    const resetInterval = setInterval(() => {
      boostCountRef.current = 0;
    }, 5 * 60 * 1000);
    
    return () => clearInterval(resetInterval);
  }, []);

  const handleStartSession = async () => {
    // Debounce rapid clicks - ignore if clicked within last 2 seconds
    if (clickTimeoutRef.current !== null) {
      console.log("Ignoring rapid click, debouncing active");
      return;
    }
    
    // Prevent multiple concurrent sessions and rapid clicking
    if (isStartingSession || sessionInProgress.current || operationLock.current) {
      console.log("Session or operation already in progress, ignoring request");
      return;
    }
    
    // Anti-abus: vérifier le nombre de boosts récents
    const now = Date.now();
    if (now - lastBoostTimeRef.current < 30000 && boostCountRef.current >= 5) {
      toast({
        title: "Action limitée",
        description: "Vous effectuez trop de boosts en peu de temps. Veuillez patienter quelques minutes.",
        variant: "destructive"
      });
      return;
    }
    
    // Vérifier l'abonnement effectif (y compris l'essai Pro)
    const effectiveSub = getEffectiveSubscription(userData.subscription);
    
    // Vérifier d'abord si la limite est atteinte en fonction de l'abonnement effectif
    const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    console.log("Vérification de limite:", currentBalanceRef.current, ">=", dailyLimit, "pour l'abonnement", effectiveSub);
    
    if (currentBalanceRef.current >= dailyLimit) {
      console.log("Daily limit already reached:", currentBalanceRef.current, ">=", dailyLimit, "for subscription", effectiveSub);
      setShowLimitAlert(true);
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite de gain journalier de ${dailyLimit}€. Revenez demain ou passez à un forfait supérieur.`,
        variant: "destructive"
      });
      return;
    }
    
    // Set click debounce
    clickTimeoutRef.current = window.setTimeout(() => {
      clickTimeoutRef.current = null;
    }, 2000);
    
    // Check if session can be started using the effective subscription
    const canStartSessionEffective = effectiveSub !== 'freemium' ? true : 
                                   canStartManualSession(userData.subscription, dailySessionCount, currentBalanceRef.current);
    
    if (!canStartSessionEffective) {
      // If freemium account and session limit reached
      if (userData.subscription === 'freemium' && effectiveSub === 'freemium' && dailySessionCount >= 1) {
        toast({
          title: "Limite de sessions atteinte",
          description: "Votre abonnement Freemium est limité à 1 session manuelle par jour. Passez à un forfait supérieur pour plus de sessions.",
          variant: "destructive"
        });
        return;
      }
      
      // If daily gain limit reached
      if (checkDailyLimit(currentBalanceRef.current, effectiveSub)) {
        setShowLimitAlert(true);
        toast({
          title: "Limite journalière atteinte",
          description: `Vous avez atteint votre limite de gain journalier de ${SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS]}€. Revenez demain ou passez à un forfait supérieur.`,
          variant: "destructive"
        });
        return;
      }
    }
    
    try {
      // Set all locks and flags
      operationLock.current = true;
      sessionInProgress.current = true;
      setIsStartingSession(true);
      
      // Increment daily session count for freemium accounts
      if (userData.subscription === 'freemium') {
        await incrementSessionCount();
      }
      
      // Simulate manual session
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Calculate gain using the utility function, ensure we use the latest balance & effective subscription
      const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const remainingAmount = dailyLimit - currentBalanceRef.current;
      
      // Vérification finale avant d'appliquer le gain
      if (remainingAmount <= 0) {
        setShowLimitAlert(true);
        toast({
          title: "Limite journalière atteinte",
          description: `Vous avez atteint votre limite de gain journalier de ${dailyLimit}€. Revenez demain ou passez à un forfait supérieur.`,
          variant: "destructive"
        });
        sessionInProgress.current = false;
        operationLock.current = false;
        setIsStartingSession(false);
        return;
      }
      
      const randomGain = calculateManualSessionGain(
        effectiveSub, 
        currentBalanceRef.current, 
        userData.referrals.length
      );
      
      // Vérifier une dernière fois que nous ne dépassons pas la limite
      const calculatedNewBalance = currentBalanceRef.current + randomGain;
      const finalGain = calculatedNewBalance > dailyLimit ? 
                        dailyLimit - currentBalanceRef.current : 
                        randomGain;
                        
      if (finalGain <= 0) {
        setShowLimitAlert(true);
        toast({
          title: "Limite journalière atteinte",
          description: `Vous avez atteint votre limite de gain journalier de ${dailyLimit}€. Revenez demain ou passez à un forfait supérieur.`,
          variant: "destructive"
        });
        sessionInProgress.current = false;
        operationLock.current = false;
        setIsStartingSession(false);
        return;
      }
      
      // Mettre à jour la référence locale avant d'appeler l'API
      const newBalance = currentBalanceRef.current + finalGain;
      currentBalanceRef.current = newBalance;
      
      // Update user data
      await updateBalance(
        finalGain,
        `Session manuelle : Notre technologie a optimisé le processus et généré ${finalGain.toFixed(2)}€ de revenus pour votre compte ${userData.subscription}.`
      );
      
      // Mettre à jour le compteur de boosts
      boostCountRef.current += 1;
      lastBoostTimeRef.current = Date.now();
      
      // Vérifier si la limite est maintenant atteinte
      if (newBalance >= dailyLimit) {
        setShowLimitAlert(true);
      }
      
      toast({
        title: "Session terminée",
        description: `CashBot a généré ${finalGain.toFixed(2)}€ de revenus pour vous !`,
      });
    } catch (error) {
      console.error("Error during session:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue pendant la session. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      setIsStartingSession(false);
      sessionInProgress.current = false;
      // Release operation lock after a delay to prevent rapid clicking
      setTimeout(() => {
        operationLock.current = false;
      }, 1000);
    }
  };

  return {
    isStartingSession,
    handleStartSession
  };
};

export default useManualSessions;
