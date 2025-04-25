
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { SUBSCRIPTION_LIMITS } from "@/utils/subscription";
import balanceManager from "./balanceManager";
import { respectsDailyLimit, isStrictlyOverLimit } from "@/utils/subscription/sessionManagement";

// Mettre à jour le solde utilisateur avec mécanisme de validation double
export const updateUserBalance = async (
  userId: string, 
  currentBalance: number, 
  gain: number,
  subscription: string
) => {
  // S'assurer que le gain est toujours positif et a max 3 décimales
  const positiveGain = Math.max(0, parseFloat(gain.toFixed(3)));
  
  // Utiliser le gestionnaire centralisé pour obtenir la valeur la plus fiable
  const latestBalance = balanceManager.getCurrentBalance();
  
  // Toujours utiliser la valeur la plus élevée comme référence
  const effectiveCurrentBalance = Math.max(currentBalance, latestBalance);
  
  // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  
  // Vérifier les gains d'aujourd'hui dans la base de données
  const { data: todaysTransactions } = await supabase
    .from('transactions')
    .select('gain')
    .eq('user_id', userId)
    .gte('date', today)
    .lt('date', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString());
    
  // Calculer les gains du jour à partir des transactions
  const todaysDbGains = (todaysTransactions || []).reduce((sum, tx) => sum + (tx.gain || 0), 0);
  
  // Récupérer les gains du jour depuis le gestionnaire local
  const todaysTrackedGains = balanceManager.getDailyGains();
  
  // Utiliser la valeur la plus élevée pour une vérification stricte
  const todaysGains = Math.max(todaysDbGains, todaysTrackedGains);
  
  // Synchroniser le gestionnaire de solde avec la valeur la plus élevée
  balanceManager.setDailyGains(todaysGains);
  
  // VÉRIFICATION CRITIQUE: Si nous sommes déjà au-dessus de la limite, refuser tout gain supplémentaire
  if (isStrictlyOverLimit(subscription, todaysGains)) {
    console.error(`[CRITICAL] Daily limit already exceeded: ${todaysGains}€ >= ${SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5}€`);
    
    // Marquer la limite comme atteinte
    localStorage.setItem('dailyLimitReached', 'true');
    
    // Déclencher un événement pour informer les composants
    window.dispatchEvent(new CustomEvent('daily:limit:exceeded', {
      detail: { 
        subscription,
        dailyLimit: SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5,
        currentGains: todaysGains
      }
    }));
    
    // Retourner sans mettre à jour le solde
    return { 
      success: false, 
      newBalance: effectiveCurrentBalance,
      limitReached: true,
      error: 'daily_limit_exceeded'
    };
  }
  
  // Vérifier et ajuster le gain pour respecter strictement la limite quotidienne
  const { allowed, adjustedGain } = respectsDailyLimit(
    subscription,
    todaysGains,
    positiveGain
  );
  
  // Si le gain n'est pas autorisé, ne pas mettre à jour le solde
  if (!allowed || adjustedGain <= 0) {
    console.log(`[LIMIT] Gain rejected: ${positiveGain}€ (limit reached)`);
    return { 
      success: false, 
      newBalance: effectiveCurrentBalance,
      limitReached: true
    };
  }
  
  // Vérifier si le gain a été ajusté et en informer l'utilisateur si nécessaire
  if (adjustedGain < positiveGain) {
    console.log(`[LIMIT] Gain adjusted from ${positiveGain}€ to ${adjustedGain}€ to respect daily limit`);
    // Ne pas afficher de toast pour les petits ajustements
    if (positiveGain - adjustedGain > 0.05) {
      toast({
        title: "Limite quotidienne proche",
        description: `Votre gain a été ajusté à ${adjustedGain.toFixed(2)}€ pour respecter votre limite quotidienne.`,
        variant: "warning",
        duration: 4000
      });
    }
  }
  
  // Calculer le nouveau solde avec le gain ajusté
  const newBalance = parseFloat((effectiveCurrentBalance + adjustedGain).toFixed(3));
  
  // Mécanisme de réessai
  const maxRetries = 3;
  let retryCount = 0;
  let success = false;
  
  while (retryCount < maxRetries && !success) {
    try {
      console.log(`[BALANCE UPDATE] From ${effectiveCurrentBalance.toFixed(3)}€ to ${newBalance.toFixed(3)}€ for user ${userId} (attempt ${retryCount + 1}/${maxRetries})`);
      
      // TOUJOURS mettre à jour le solde même si on approche de la limite
      const { data, error: updateError } = await supabase
        .from('user_balances')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('balance');
      
      if (updateError) {
        console.error("[DB ERROR] Error updating balance:", updateError);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          toast({
            title: "Erreur",
            description: "Impossible de mettre à jour votre solde. Veuillez réessayer.",
            variant: "destructive",
            duration: 5000
          });
          return { success: false, newBalance: effectiveCurrentBalance, limitReached: false };
        }
        
        // Attendre avant de réessayer (backoff exponentiel)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
      } else {
        success = true;
        
        // Mettre à jour le gestionnaire central de solde
        const dbReturnedBalance = data?.[0]?.balance;
        if (typeof dbReturnedBalance === 'number' && !isNaN(dbReturnedBalance)) {
          // Forcer la synchronisation avec la valeur de la base
          balanceManager.forceBalanceSync(dbReturnedBalance);
          
          // Mettre à jour les gains quotidiens
          balanceManager.addDailyGain(adjustedGain);
          
          // Déclencher un événement pour informer tous les composants de la mise à jour
          window.dispatchEvent(new CustomEvent('db:balance-updated', {
            detail: { 
              newBalance: dbReturnedBalance,
              gainAmount: adjustedGain,
              dailyGains: balanceManager.getDailyGains()
            }
          }));
        } else {
          // Sinon, mettre à jour avec la valeur calculée localement
          balanceManager.updateBalance(adjustedGain);
          balanceManager.addDailyGain(adjustedGain);
        }
        
        // Vérifier si on approche de la limite après cette mise à jour
        const updatedDailyGains = balanceManager.getDailyGains();
        const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
        const percentage = Math.min(100, (updatedDailyGains / dailyLimit) * 100);
        
        if (percentage >= 90) {
          window.dispatchEvent(new CustomEvent('daily:limit:warning', {
            detail: { 
              subscription,
              dailyLimit,
              currentGains: updatedDailyGains,
              percentage
            }
          }));
        }
        
        return { 
          success: true, 
          newBalance: data?.[0]?.balance || newBalance,
          limitReached: percentage >= 99,
          adjustedGain
        };
      }
    } catch (error) {
      console.error("[ERROR] Error in updateBalance (attempt " + (retryCount + 1) + "):", error);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue. Veuillez réessayer.",
          variant: "destructive",
          duration: 5000
        });
        return { success: false, newBalance: effectiveCurrentBalance, limitReached: false };
      }
      
      // Attendre avant de réessayer (backoff exponentiel)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
    }
  }
  
  // Ce point ne devrait pas être atteint mais ajouté comme fallback
  return { success: false, newBalance: effectiveCurrentBalance, limitReached: false };
};
