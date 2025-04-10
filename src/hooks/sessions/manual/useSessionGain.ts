
import { toast } from '@/components/ui/use-toast';
import { 
  SUBSCRIPTION_LIMITS, 
  calculateManualSessionGain
} from '@/utils/subscription';
import { UserData } from '@/types/userData';
import { useLimitChecking } from './useLimitChecking';
import { useIsMobile } from '@/hooks/use-mobile';

export const useSessionGain = () => {
  const { checkFinalGainLimit } = useLimitChecking();
  const isMobile = useIsMobile();
  
  const calculateSessionGain = async (
    userData: UserData,
    currentBalance: number,
    setShowLimitAlert: (show: boolean) => void
  ): Promise<{ success: boolean; finalGain: number; newBalance: number }> => {
    // Simuler un délai de traitement de session
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Obtenir l'abonnement effectif
    const effectiveSub = userData.subscription;
    
    // Calculer la limite quotidienne basée sur l'abonnement
    const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Calculer les gains d'aujourd'hui pour la vérification des limites (utiliser les transactions)
    const todaysTransactions = userData.transactions.filter(tx => 
      tx.date.startsWith(today) && tx.gain > 0
    );
    
    const todaysGains = todaysTransactions.reduce((sum, tx) => sum + tx.gain, 0);
    
    // Calculer le montant restant pour aujourd'hui (non lié au solde total)
    const remainingAmount = dailyLimit - todaysGains;
    
    // Vérification finale avant d'appliquer le gain
    if (remainingAmount <= 0) {
      setShowLimitAlert(true);
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite de gain journalier de ${dailyLimit}€. Revenez demain ou passez à un forfait supérieur.`,
        variant: "destructive",
        className: isMobile ? "mobile-toast" : "",
        duration: 4000
      });
      return { success: false, finalGain: 0, newBalance: currentBalance };
    }
    
    // Calculer le gain en utilisant la fonction utilitaire
    const randomGain = calculateManualSessionGain(
      effectiveSub, 
      todaysGains, // Passer les gains du jour, pas le solde total
      userData.referrals.length
    );
    
    // Vérification finale pour s'assurer que nous ne dépassons pas la limite
    const { shouldProceed, finalGain } = checkFinalGainLimit(
      todaysGains, // Utiliser les gains du jour au lieu du solde total
      randomGain,
      dailyLimit,
      setShowLimitAlert
    );
    
    if (!shouldProceed) {
      return { success: false, finalGain: 0, newBalance: currentBalance };
    }
    
    // Calculer le nouveau solde (le solde total augmente)
    const newBalance = currentBalance + finalGain;
    
    // Persister le nouveau solde dans localStorage pour éviter les pertes lors des rechargements de page
    try {
      localStorage.setItem('lastUpdatedBalance', newBalance.toString());
      localStorage.setItem('lastBalanceUpdateTime', new Date().toISOString());
    } catch (e) {
      console.error("Failed to persist balance in local storage:", e);
    }
    
    // Afficher un toast de succès avec classe mobile-toast pour les appareils mobiles
    toast({
      title: "Analyse terminée",
      description: `Traitement des données achevé. Revenus générés : ${finalGain.toFixed(2)}€`,
      className: isMobile ? "mobile-toast" : "",
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
