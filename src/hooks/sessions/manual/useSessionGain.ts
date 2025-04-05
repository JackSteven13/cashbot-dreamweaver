
import { toast } from '@/components/ui/use-toast';
import { 
  SUBSCRIPTION_LIMITS, 
  calculateManualSessionGain
} from '@/utils/subscription';
import { UserData } from '@/types/userData';
import { useLimitChecking } from './useLimitChecking';

export const useSessionGain = () => {
  const { checkFinalGainLimit } = useLimitChecking();
  
  const calculateSessionGain = async (
    userData: UserData,
    currentBalance: number,
    setShowLimitAlert: (show: boolean) => void
  ): Promise<{ success: boolean; finalGain: number; newBalance: number }> => {
    // Simulate session processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get effective subscription
    const effectiveSub = userData.subscription;
    
    // Calculate daily limit based on subscription
    const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate today's gains for limit checking (use transactions)
    const todaysTransactions = userData.transactions.filter(tx => 
      tx.date.startsWith(today) && tx.gain > 0
    );
    
    const todaysGains = todaysTransactions.reduce((sum, tx) => sum + tx.gain, 0);
    
    // Calculate remaining amount for today (not related to the total balance)
    const remainingAmount = dailyLimit - todaysGains;
    
    // Final verification before applying gain
    if (remainingAmount <= 0) {
      setShowLimitAlert(true);
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite de gain journalier de ${dailyLimit}€. Revenez demain ou passez à un forfait supérieur.`,
        variant: "destructive",
        className: "mobile-toast",
        duration: 4000
      });
      return { success: false, finalGain: 0, newBalance: currentBalance };
    }
    
    // Calculate gain using utility function
    const randomGain = calculateManualSessionGain(
      effectiveSub, 
      todaysGains, // Pass today's gains, not the total balance
      userData.referrals.length
    );
    
    // Final check to ensure we don't exceed limit
    const { shouldProceed, finalGain } = checkFinalGainLimit(
      todaysGains, // Use today's gains instead of total balance
      randomGain,
      dailyLimit,
      setShowLimitAlert
    );
    
    if (!shouldProceed) {
      return { success: false, finalGain: 0, newBalance: currentBalance };
    }
    
    // Calculate new balance (total balance increases)
    const newBalance = currentBalance + finalGain;
    
    // Persist the new balance in localStorage to prevent loss during page reloads
    try {
      localStorage.setItem('lastUpdatedBalance', newBalance.toString());
      localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
    } catch (e) {
      console.error("Failed to persist balance in local storage:", e);
    }
    
    // Show success toast
    toast({
      title: "Analyse terminée",
      description: `Traitement des données achevé. Revenus générés : ${finalGain.toFixed(2)}€`,
      className: "mobile-toast",
      duration: 4000
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
