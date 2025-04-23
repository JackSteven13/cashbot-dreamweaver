
import { toast } from '@/components/ui/use-toast';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import { getEffectiveSubscription } from '@/utils/subscription/subscriptionStatus';
import { canStartManualSession } from '@/utils/subscription/sessionManagement';

export const useLimitChecking = () => {
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
    
    // Pour les comptes freemium, vérification stricte de la limite de session
    if ((userData.subscription || 'freemium') === 'freemium') {
      // Vérifier si la limite quotidienne est déjà atteinte dans localStorage
      const limitReached = localStorage.getItem('freemium_daily_limit_reached');
      const lastSessionDate = localStorage.getItem('last_session_date');
      
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
    
    // Calculer les gains d'aujourd'hui pour la vérification des limites (utiliser les transactions)
    const todaysTransactions = (userData.transactions || []).filter(tx => 
      tx.date?.startsWith(today) && tx.gain > 0
    );
    
    const todaysGains = todaysTransactions.reduce((sum, tx) => sum + tx.gain, 0);
    
    // Vérifier d'abord si la limite est atteinte en fonction de l'abonnement effectif
    const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    console.log("Vérification de limite:", todaysGains, ">=", dailyLimit, "pour l'abonnement", effectiveSub);
    
    if (todaysGains >= dailyLimit) {
      console.log("Daily limit already reached:", todaysGains, ">=", dailyLimit, "for subscription", effectiveSub);
      setShowLimitAlert(true);
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite de gain journalier de ${dailyLimit}€. Revenez demain ou passez à un forfait supérieur.`,
        variant: "destructive"
      });
      return false;
    }
    
    // Check if session can be started using the effective subscription
    const canStartSessionEffective = effectiveSub !== 'freemium' ? true : 
                                   canStartManualSession(userData.subscription || 'freemium', dailySessionCount, todaysGains);
    
    if (!canStartSessionEffective.canStart) {
      // If freemium account and session limit reached
      toast({
        title: "Limite atteinte",
        description: canStartSessionEffective.reason || "Vous ne pouvez pas démarrer une nouvelle session maintenant.",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
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
                    dailyLimit - todaysGains : 
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
