
import { toast } from '@/components/ui/use-toast';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import { getEffectiveSubscription } from '@/utils/subscription/subscriptionStatus';
import { canStartManualSession, SessionCheckResult } from '@/utils/subscription/sessionManagement';
import { useAuth } from '@/hooks/useAuth';
import balanceManager from '@/utils/balance/balanceManager';

export const useLimitChecking = () => {
  const { user } = useAuth();
  
  const checkSessionLimit = (
    userData: UserData | Partial<UserData>, 
    dailySessionCount: number,
    currentBalance: number,
    setShowLimitAlert: (show: boolean) => void
  ): boolean => {
    // Vérifier l'abonnement effectif (y compris l'essai Pro)
    const effectiveSub = getEffectiveSubscription(userData.subscription || 'freemium');
    
    // Récupérer la date d'aujourd'hui au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Utiliser une clé spécifique à l'utilisateur pour le localStorage
    const userId = userData.id || user?.id || 'anonymous';
    const limitReachedKey = `freemium_daily_limit_reached_${userId}`;
    const lastSessionDateKey = `last_session_date_${userId}`;
    
    // Pour les comptes freemium, vérification stricte de la limite de session
    if ((userData.subscription || 'freemium') === 'freemium') {
      // Vérifier si la limite quotidienne est déjà atteinte dans localStorage
      const limitReached = localStorage.getItem(limitReachedKey);
      const lastSessionDate = localStorage.getItem(lastSessionDateKey);
      
      if (lastSessionDate === new Date().toDateString() && 
         (limitReached === 'true' || dailySessionCount >= 1)) {
        console.log("Freemium daily session limit already reached");
        setShowLimitAlert(true);
        toast({
          title: "Limite quotidienne atteinte",
          description: "Votre abonnement Freemium est limité à 1 session manuelle par jour.",
          variant: "destructive"
        });
        return false;
      }
    }
    
    // Synchroniser les gains quotidiens avec balanceManager
    const dailyGains = balanceManager.getDailyGains();
    
    // Vérifier d'abord si la limite est atteinte en fonction de l'abonnement effectif
    const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    console.log(`Vérification de limite pour ${userId}:`, dailyGains, ">=", dailyLimit, "pour l'abonnement", effectiveSub);
    
    if (dailyGains >= dailyLimit) {
      console.log("Daily limit already reached:", dailyGains, ">=", dailyLimit, "for subscription", effectiveSub);
      setShowLimitAlert(true);
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite de gain journalier de ${dailyLimit}€. Revenez demain ou passez à un forfait supérieur.`,
        variant: "destructive"
      });
      return false;
    }
    
    // Check if session can be started using the effective subscription
    const sessionCheckResult = canStartManualSession(userData.subscription || 'freemium', dailySessionCount, dailyGains);
    
    // Fix: Handle both boolean and SessionCheckResult return types
    if (typeof sessionCheckResult === 'boolean') {
      // If it's boolean false, we assume it cannot start but don't have a specific reason
      if (!sessionCheckResult) {
        toast({
          title: "Limite atteinte",
          description: "Vous ne pouvez pas démarrer une nouvelle session maintenant.",
          variant: "destructive"
        });
        return false;
      }
      // If it's true, then we can start
      return true;
    } else {
      // It's a SessionCheckResult object
      if (!sessionCheckResult.canStart) {
        // If canStart is false, show reason
        toast({
          title: "Limite atteinte",
          description: sessionCheckResult.reason || "Vous ne pouvez pas démarrer une nouvelle session maintenant.",
          variant: "destructive"
        });
        return false;
      }
      return true;
    }
  };
  
  const checkFinalGainLimit = (
    todaysGains: number,
    randomGain: number,
    dailyLimit: number,
    setShowLimitAlert: (show: boolean) => void
  ): { shouldProceed: boolean; finalGain: number } => {
    // Vérifier une dernière fois que nous ne dépassons pas la limite
    const calculatedNewGains = todaysGains + randomGain;
    const finalGain = calculatedNewGains > dailyLimit ? 
                    Math.max(0, dailyLimit - todaysGains) : 
                    randomGain;
                    
    if (finalGain <= 0) {
      setShowLimitAlert(true);
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite de gain journalier de ${dailyLimit}€. Revenez demain ou passez à un forfait supérieur.`,
        variant: "destructive"
      });
      return { shouldProceed: false, finalGain: 0 };
    }
    
    return { shouldProceed: true, finalGain };
  };
  
  // Nouvelle fonction pour déterminer si on est proche de la limite (>80%)
  const checkNearLimit = (todaysGains: number, dailyLimit: number): boolean => {
    const percentage = (todaysGains / dailyLimit) * 100;
    return percentage >= 80 && percentage < 100;
  };

  // Nouvelle fonction pour obtenir les gains quotidiens actuels
  const getTodaysGains = (userData: UserData | Partial<UserData>): number => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTransactions = (userData.transactions || []).filter(tx => 
      tx.date?.startsWith(today) && tx.gain > 0
    );
    
    return todaysTransactions.reduce((sum, tx) => sum + tx.gain, 0);
  };
  
  return {
    checkSessionLimit,
    checkFinalGainLimit,
    checkNearLimit,
    getTodaysGains
  };
};

export default useLimitChecking;
