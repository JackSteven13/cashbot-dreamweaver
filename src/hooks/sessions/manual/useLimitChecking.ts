
import { toast } from '@/components/ui/use-toast';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import { getEffectiveSubscription } from '@/utils/subscription/subscriptionStatus';
import { canStartManualSession } from '@/utils/subscription/sessionManagement';

export const useLimitChecking = () => {
  const checkSessionLimit = (
    userData: UserData, 
    dailySessionCount: number,
    currentBalance: number,
    setShowLimitAlert: (show: boolean) => void
  ): boolean => {
    // Vérifier l'abonnement effectif (y compris l'essai Pro)
    const effectiveSub = getEffectiveSubscription(userData.subscription);
    
    // Récupérer la date d'aujourd'hui au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Calculer les gains d'aujourd'hui pour la vérification des limites (utiliser les transactions)
    const todaysTransactions = userData.transactions.filter(tx => 
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
                                   canStartManualSession(userData.subscription, dailySessionCount, todaysGains);
    
    if (!canStartSessionEffective) {
      // If freemium account and session limit reached
      if (userData.subscription === 'freemium' && effectiveSub === 'freemium' && dailySessionCount >= 1) {
        toast({
          title: "Limite de sessions atteinte",
          description: "Votre abonnement Freemium est limité à 1 session manuelle par jour. Passez à un forfait supérieur pour plus de sessions.",
          variant: "destructive"
        });
        return false;
      }
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
  const getTodaysGains = (userData: UserData): number => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTransactions = userData.transactions.filter(tx => 
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
