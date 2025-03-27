
import { toast } from '@/components/ui/use-toast';
import { 
  SUBSCRIPTION_LIMITS, 
  getEffectiveSubscription,
  calculateManualSessionGain
} from '@/utils/subscriptionUtils';
import { UserData } from '@/types/userData';
import { useLimitChecking } from './useLimitChecking';

export const useSessionGain = () => {
  const { checkFinalGainLimit } = useLimitChecking();
  
  const calculateSessionGain = async (
    userData: UserData,
    currentBalance: number,
    setShowLimitAlert: (show: boolean) => void
  ): Promise<{ success: boolean; finalGain: number; newBalance: number }> => {
    if (!userData || currentBalance === undefined) {
      console.error("Invalid userData or balance in calculateSessionGain", {
        userData: !!userData,
        balance: currentBalance
      });
      
      toast({
        title: "Erreur technique",
        description: "Une erreur est survenue lors du calcul du gain. Veuillez rafraîchir la page.",
        variant: "destructive"
      });
      
      return { success: false, finalGain: 0, newBalance: currentBalance || 0 };
    }
    
    // Simulate session processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get effective subscription
    const effectiveSub = getEffectiveSubscription(userData.subscription || 'freemium');
    
    // Calculate daily limit based on effective subscription
    const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    const remainingAmount = dailyLimit - currentBalance;
    
    // Final verification before applying gain
    if (remainingAmount <= 0) {
      setShowLimitAlert(true);
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite de gain journalier de ${dailyLimit}€. Revenez demain ou passez à un forfait supérieur.`,
        variant: "destructive"
      });
      return { success: false, finalGain: 0, newBalance: currentBalance };
    }
    
    // Calculate gain using utility function
    const referralCount = Array.isArray(userData.referrals) ? userData.referrals.length : 0;
    const randomGain = calculateManualSessionGain(
      effectiveSub, 
      currentBalance, 
      referralCount
    );
    
    // Final check to ensure we don't exceed limit
    const { shouldProceed, finalGain } = checkFinalGainLimit(
      currentBalance,
      randomGain,
      dailyLimit,
      setShowLimitAlert
    );
    
    if (!shouldProceed) {
      return { success: false, finalGain: 0, newBalance: currentBalance };
    }
    
    // Calculate new balance
    const newBalance = currentBalance + finalGain;
    
    // Show success toast
    toast({
      title: "Session terminée",
      description: `CashBot a généré ${finalGain.toFixed(2)}€ de revenus pour vous !`,
    });
    
    return {
      success: true,
      finalGain,
      newBalance
    };
  };
  
  return {
    calculateSessionGain
  };
};
