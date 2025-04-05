
import { toast } from '@/components/ui/use-toast';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import { getEffectiveSubscription } from '@/utils/subscription';
import { canStartManualSession } from '@/utils/subscription';

export const useLimitChecking = () => {
  const checkSessionLimit = (
    userData: UserData, 
    dailySessionCount: number,
    currentBalance: number,
    setShowLimitAlert: (show: boolean) => void
  ): boolean => {
    // Vérifier l'abonnement effectif (y compris l'essai Pro)
    const effectiveSub = getEffectiveSubscription(userData.subscription);
    
    // Vérifier d'abord si la limite est atteinte en fonction de l'abonnement effectif
    const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    console.log("Vérification de limite:", currentBalance, ">=", dailyLimit, "pour l'abonnement", effectiveSub);
    
    if (currentBalance >= dailyLimit) {
      console.log("Daily limit already reached:", currentBalance, ">=", dailyLimit, "for subscription", effectiveSub);
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
                                   canStartManualSession(userData.subscription, dailySessionCount, currentBalance);
    
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
      
      // If daily gain limit reached
      if (currentBalance >= dailyLimit) {
        setShowLimitAlert(true);
        toast({
          title: "Limite journalière atteinte",
          description: `Vous avez atteint votre limite de gain journalier de ${SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS]}€. Revenez demain ou passez à un forfait supérieur.`,
          variant: "destructive"
        });
        return false;
      }
    }
    
    return true;
  };
  
  const checkFinalGainLimit = (
    currentBalance: number,
    randomGain: number,
    dailyLimit: number,
    setShowLimitAlert: (show: boolean) => void
  ): { shouldProceed: boolean; finalGain: number } => {
    // Vérifier une dernière fois que nous ne dépassons pas la limite
    const calculatedNewBalance = currentBalance + randomGain;
    const finalGain = calculatedNewBalance > dailyLimit ? 
                    dailyLimit - currentBalance : 
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
  
  return {
    checkSessionLimit,
    checkFinalGainLimit
  };
};

export default useLimitChecking;
