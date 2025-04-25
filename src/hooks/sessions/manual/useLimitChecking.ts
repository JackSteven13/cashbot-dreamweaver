
import { toast } from '@/components/ui/use-toast';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import { getEffectiveSubscription } from '@/utils/auth/subscriptionUtils';
import { canStartManualSession, calculateLimitPercentage } from '@/utils/subscription/sessionManagement';
import balanceManager from '@/utils/balance/balanceManager';

export const useLimitChecking = () => {
  /**
   * Fonction principale de vérification des limites avant démarrage de session
   */
  const checkSessionLimit = (
    userData: UserData | Partial<UserData>, 
    dailySessionCount: number,
    setShowLimitAlert: (show: boolean) => void
  ): boolean => {
    // Vérifier l'abonnement effectif
    const effectiveSub = getEffectiveSubscription(userData.subscription || 'freemium');
    
    // Récupérer les gains du jour depuis le gestionnaire central
    const todaysGains = balanceManager.getDailyGains();
    
    // Obtenir la limite quotidienne selon l'abonnement
    const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Vérifier d'abord si la limite est atteinte/presque atteinte
    const percentage = calculateLimitPercentage(effectiveSub, todaysGains);
    
    console.log(`[LIMIT CHECK] Today's gains: ${todaysGains.toFixed(2)}€/${dailyLimit}€ (${percentage.toFixed(1)}%) for subscription ${effectiveSub}`);
    
    // VÉRIFICATION STRICTE: Si nous sommes à plus de 95% de la limite, bloquer
    if (percentage >= 95) {
      console.log(`[LIMIT BLOCKED] Daily limit at ${percentage.toFixed(1)}%: ${todaysGains.toFixed(2)}€/${dailyLimit}€`);
      
      // Marquer la limite comme atteinte
      localStorage.setItem('dailyLimitReached', 'true');
      
      // Afficher l'alerte de limite
      setShowLimitAlert(true);
      
      // Informer l'utilisateur
      toast({
        title: "Limite journalière presque atteinte",
        description: `Vous avez presque atteint votre limite de gain journalier de ${dailyLimit}€. Passez à un forfait supérieur pour continuer.`,
        variant: "destructive",
        duration: 5000
      });
      
      // Informer les autres composants
      window.dispatchEvent(new CustomEvent('daily:limit:critical', {
        detail: { 
          subscription: effectiveSub,
          dailyLimit,
          currentGains: todaysGains,
          percentage
        }
      }));
      
      return false;
    }
    
    // Vérifier si la session peut être démarrée en utilisant les règles standard
    const { canStart, reason } = canStartManualSession(
      effectiveSub, 
      dailySessionCount, 
      todaysGains
    );
    
    if (!canStart) {
      console.log(`[SESSION BLOCKED] Reason: ${reason}`);
      
      // Si compte freemium et limite de session atteinte
      if ((userData.subscription || 'freemium') === 'freemium' && reason?.includes('freemium')) {
        setShowLimitAlert(true);
        toast({
          title: "Limite de sessions atteinte",
          description: "Votre abonnement Freemium est limité à 1 session manuelle par jour. Passez à un forfait supérieur pour plus de sessions.",
          variant: "destructive",
          duration: 4000
        });
      } else if (reason?.includes('gains')) {
        setShowLimitAlert(true);
        toast({
          title: "Limite journalière presque atteinte",
          description: `Vous approchez de votre limite quotidienne de ${dailyLimit}€.`,
          variant: "destructive",
          duration: 4000
        });
      }
      
      return false;
    }
    
    // Si nous approchons de la limite (75-95%), afficher un avertissement mais autoriser
    if (percentage >= 75 && percentage < 95) {
      toast({
        title: "Attention",
        description: `Vous approchez de votre limite quotidienne (${Math.round(percentage)}%). Il vous reste ${(dailyLimit - todaysGains).toFixed(2)}€ aujourd'hui.`,
        duration: 4000
      });
      
      // Déclencher un événement d'avertissement
      window.dispatchEvent(new CustomEvent('daily:limit:warning', {
        detail: { 
          subscription: effectiveSub,
          dailyLimit,
          currentGains: todaysGains,
          percentage
        }
      }));
    }
    
    return true;
  };
  
  /**
   * Vérification finale du gain pour s'assurer de ne pas dépasser la limite
   */
  const checkFinalGainLimit = (
    todaysGains: number,
    randomGain: number,
    dailyLimit: number,
    setShowLimitAlert: (show: boolean) => void
  ): { shouldProceed: boolean; finalGain: number } => {
    // Vérification stricte pour ne pas dépasser la limite
    const calculatedNewGains = todaysGains + randomGain;
    
    // Si le total dépasserait la limite à 97.5%
    if (calculatedNewGains > dailyLimit * 0.975) {
      const finalGain = Math.max(0, (dailyLimit * 0.975) - todaysGains);
      
      // Si le gain ajusté est trop petit, refuser complètement
      if (finalGain < 0.01) {
        setShowLimitAlert(true);
        toast({
          title: "Limite journalière presque atteinte",
          description: `Vous avez presque atteint votre limite de gain journalier de ${dailyLimit}€.`,
          variant: "destructive",
          duration: 5000
        });
        return { shouldProceed: false, finalGain: 0 };
      }
      
      // Autoriser un gain réduit avec avertissement
      toast({
        title: "Gain ajusté",
        description: `Votre gain a été ajusté à ${finalGain.toFixed(2)}€ pour respecter votre limite quotidienne.`,
        duration: 4000
      });
      
      return { shouldProceed: true, finalGain };
    }
    
    return { shouldProceed: true, finalGain: randomGain };
  };
  
  /**
   * Obtenir les gains actuels du jour
   */
  const getTodaysGains = (userData: UserData | Partial<UserData>): number => {
    // Utiliser en priorité le gestionnaire centralisé de solde
    const trackedGains = balanceManager.getDailyGains();
    
    // Mais vérifier aussi les transactions du jour comme filet de sécurité
    const today = new Date().toISOString().split('T')[0];
    const todaysTransactions = (userData.transactions || []).filter(tx => 
      tx.date?.startsWith(today) && tx.gain > 0
    );
    
    const transactionGains = todaysTransactions.reduce((sum, tx) => sum + tx.gain, 0);
    
    // Retourner la valeur la plus élevée pour une vérification plus stricte
    return Math.max(trackedGains, transactionGains);
  };
  
  /**
   * Vérifier si on est proche de la limite (>80%)
   */
  const checkNearLimit = (todaysGains: number, dailyLimit: number): boolean => {
    const percentage = (todaysGains / dailyLimit) * 100;
    return percentage >= 80 && percentage < 100;
  };
  
  return {
    checkSessionLimit,
    checkFinalGainLimit,
    checkNearLimit,
    getTodaysGains
  };
};

export default useLimitChecking;
