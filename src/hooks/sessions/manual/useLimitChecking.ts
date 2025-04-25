
import { toast } from '@/components/ui/use-toast';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import { getEffectiveSubscription } from '@/utils/subscription/subscriptionStatus';
import { canStartManualSession } from '@/utils/subscription/sessionManagement';
import { 
  formatPrice, 
  getDailyLimitDetails, 
  calculateRemainingAmount 
} from '@/utils/balance/limitCalculations';
import balanceManager from '@/utils/balance/balanceManager';

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
    
    // Récupérer les gains quotidiens actuels depuis le gestionnaire de solde
    const todaysGains = balanceManager.getDailyGains();
    
    // Vérifier les transactions pour double-confirmation
    const todaysTransactions = (userData.transactions || []).filter(tx => 
      tx.date?.startsWith(today) && tx.gain > 0
    );
    
    const transactionGains = todaysTransactions.reduce((sum, tx) => sum + tx.gain, 0);
    
    // Utiliser la valeur la plus élevée pour la sécurité
    const actualGains = Math.max(todaysGains, transactionGains);
    
    // Vérifier d'abord si la limite est atteinte en fonction de l'abonnement effectif
    const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    console.log("Vérification de limite:", actualGains, ">=", dailyLimit, "pour l'abonnement", effectiveSub);
    
    if (actualGains >= dailyLimit) {
      console.log("Daily limit already reached:", actualGains, ">=", dailyLimit, "for subscription", effectiveSub);
      setShowLimitAlert(true);
      
      // Obtenir les détails complets pour un message plus informatif
      const limitDetails = getDailyLimitDetails(actualGains, dailyLimit, effectiveSub);
      
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite de gain journalier de ${limitDetails.formattedLimit}. Réinitialisation dans ${limitDetails.resetTime}.`,
        variant: "destructive"
      });
      return false;
    }
    
    // Check if session can be started using the effective subscription
    const canStartSessionEffective = effectiveSub !== 'freemium' ? true : 
                                   canStartManualSession(userData.subscription || 'freemium', dailySessionCount, actualGains);
    
    if (!canStartSessionEffective) {
      // If freemium account and session limit reached
      if ((userData.subscription || 'freemium') === 'freemium' && effectiveSub === 'freemium' && dailySessionCount >= 1) {
        toast({
          title: "Limite de sessions atteinte",
          description: "Votre abonnement Freemium est limité à 1 session manuelle par jour. Passez à un forfait supérieur pour plus de sessions.",
          variant: "destructive"
        });
        return false;
      }
    }
    
    // Si on arrive à ce point, l'utilisateur peut démarrer une session
    return true;
  };
  
  const checkFinalGainLimit = (
    todaysGains: number,
    randomGain: number,
    dailyLimit: number,
    setShowLimitAlert: (show: boolean) => void
  ): { shouldProceed: boolean; finalGain: number } => {
    // Vérifier que les gains actuels sont à jour
    const actualGains = balanceManager.getDailyGains();
    const effectiveGains = Math.max(todaysGains, actualGains);
    
    // Vérifier une dernière fois que nous ne dépassons pas la limite
    const calculatedNewGains = effectiveGains + randomGain;
    const finalGain = calculatedNewGains > dailyLimit ? 
                    dailyLimit - effectiveGains : 
                    randomGain;
                    
    if (finalGain <= 0) {
      setShowLimitAlert(true);
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite de gain journalier de ${formatPrice(dailyLimit)}. Revenez demain ou passez à un forfait supérieur.`,
        variant: "destructive"
      });
      return { shouldProceed: false, finalGain: 0 };
    }
    
    // Mettre à jour le gestionnaire de solde avec la valeur la plus précise
    if (effectiveGains > todaysGains) {
      balanceManager.setDailyGains(effectiveGains);
    }
    
    return { shouldProceed: true, finalGain };
  };
  
  // Fonction pour déterminer si on est proche de la limite (>80%)
  const checkNearLimit = (todaysGains: number, dailyLimit: number): boolean => {
    const percentage = (todaysGains / dailyLimit) * 100;
    return percentage >= 80 && percentage < 100;
  };

  // Fonction pour obtenir les gains quotidiens actuels
  const getTodaysGains = async (userData: UserData | Partial<UserData>): Promise<number> => {
    const today = new Date().toISOString().split('T')[0];
    
    // Obtenir les gains depuis le gestionnaire de solde
    const managerGains = balanceManager.getDailyGains();
    
    // Calculer les gains depuis les transactions
    const todaysTransactions = (userData.transactions || []).filter(tx => 
      tx.date?.startsWith(today) && tx.gain > 0
    );
    
    const transactionGains = todaysTransactions.reduce((sum, tx) => sum + tx.gain, 0);
    
    // Utiliser la valeur la plus élevée pour la sécurité
    const actualGains = Math.max(managerGains, transactionGains);
    
    // Mettre à jour le gestionnaire de solde si nécessaire
    if (actualGains > managerGains) {
      balanceManager.setDailyGains(actualGains);
    }
    
    return actualGains;
  };
  
  return {
    checkSessionLimit,
    checkFinalGainLimit,
    checkNearLimit,
    getTodaysGains
  };
};

export default useLimitChecking;
