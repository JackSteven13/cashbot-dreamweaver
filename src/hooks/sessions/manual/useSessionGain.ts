
import { toast } from '@/components/ui/use-toast';
import { 
  SUBSCRIPTION_LIMITS, 
  calculateManualSessionGain
} from '@/utils/subscription';
import { UserData } from '@/types/userData';
import { useLimitChecking } from './useLimitChecking';
import { useIsMobile } from '@/hooks/use-mobile';
import balanceManager from '@/utils/balance/balanceManager';

export const useSessionGain = () => {
  const { checkFinalGainLimit } = useLimitChecking();
  const isMobile = useIsMobile();
  
  const calculateSessionGain = async (
    userData: UserData | Partial<UserData>,
    currentBalance: number,
    setShowLimitAlert: (show: boolean) => void
  ): Promise<{ success: boolean; finalGain: number; newBalance: number }> => {
    // Simuler un délai de traitement de session
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // S'assurer que nous avons l'ID de l'utilisateur
    const userId = userData.profile?.id || 'anonymous';
    
    // Obtenir l'abonnement effectif
    const effectiveSub = userData.subscription || 'freemium';
    
    // Calculer la limite quotidienne basée sur l'abonnement
    const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // S'assurer que userData.transactions existe
    const transactions = Array.isArray(userData.transactions) ? userData.transactions : [];
    
    // Calculer les gains d'aujourd'hui pour la vérification des limites (utiliser les transactions)
    const todaysTransactions = transactions.filter(tx => 
      tx.date && tx.date.startsWith(today) && tx.gain && tx.gain > 0
    );
    
    const todaysGains = todaysTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);
    
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
      (userData.referrals || []).length
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
    
    // S'assurer que le solde actuel est un nombre valide
    const safeCurrentBalance = isNaN(currentBalance) ? 0 : currentBalance;
    
    // Calculer le nouveau solde (le solde total augmente)
    const newBalance = safeCurrentBalance + finalGain;
    
    // Utiliser des clés de stockage spécifiques à l'utilisateur
    const userSpecificKeys = {
      lastUpdatedBalance: `lastUpdatedBalance_${userId}`,
      lastKnownBalance: `lastKnownBalance_${userId}`,
      currentBalance: `currentBalance_${userId}`,
      sessionCurrentBalance: `currentBalance_${userId}`
    };
    
    // Persister le nouveau solde dans toutes les sources pour éviter les pertes lors des rechargements de page
    try {
      // Mettre à jour le balance manager (source unique de vérité)
      balanceManager.forceBalanceSync(newBalance, userId);
      
      // Persister dans toutes les sources de stockage avec des clés spécifiques à l'utilisateur
      localStorage.setItem(userSpecificKeys.lastUpdatedBalance, newBalance.toString());
      localStorage.setItem(userSpecificKeys.lastKnownBalance, newBalance.toString());
      localStorage.setItem(userSpecificKeys.currentBalance, newBalance.toString());
      sessionStorage.setItem(userSpecificKeys.sessionCurrentBalance, newBalance.toString());
      
      // Mettre à jour le solde le plus élevé si nécessaire
      if (typeof balanceManager.updateHighestBalance === 'function') {
        balanceManager.updateHighestBalance(newBalance, userId);
      }
      
      // Déclencher un événement pour informer les autres composants
      window.dispatchEvent(new CustomEvent('session:completed', {
        detail: {
          gain: finalGain,
          finalBalance: newBalance,
          timestamp: Date.now(),
          userId
        }
      }));
      
      // Déclencher une animation du solde
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          gain: finalGain,
          newBalance: newBalance,
          animate: true,
          userId
        }
      }));
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

export default useSessionGain;
