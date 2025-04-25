
import { useEffect, useState } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import { getEffectiveSubscription } from '@/utils/auth/subscriptionUtils';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface BalanceState {
  dailyGains: number;
  limitPercentage: number;
  isLimitReached: boolean;
  isNearLimit: boolean;
  effectiveSubscription: string;
  dailyLimit: number;
}

export const useBalanceEvents = (subscription: string, balance: number = 0) => {
  const [balanceState, setBalanceState] = useState<BalanceState>({
    dailyGains: 0,
    limitPercentage: 0,
    isLimitReached: false,
    isNearLimit: false,
    effectiveSubscription: subscription,
    dailyLimit: 0
  });

  // Récupérer le vrai solde depuis la base de données
  useEffect(() => {
    const fetchActualBalance = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
          .from('user_balances')
          .select('balance')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error('Erreur récupération solde:', error);
          return;
        }

        if (data && data.balance > 0 && balance <= 0) {
          console.log(`Solde incorrect détecté: Local=${balance}, DB=${data.balance}`);
          // Force la mise à jour du gestionnaire de solde
          balanceManager.forceBalanceSync(data.balance, session.user.id);
          
          // Déclenche un événement pour forcer l'interface à se mettre à jour
          window.dispatchEvent(new CustomEvent('balance:force-update', {
            detail: {
              newBalance: data.balance,
              userId: session.user.id
            }
          }));
          
          toast({
            title: "Solde restauré",
            description: `Votre solde a été restauré à ${data.balance.toFixed(2)}€`,
            variant: "default"
          });
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du solde:', err);
      }
    };
    
    fetchActualBalance();
  }, [balance]);

  // Mettre à jour l'état en fonction des nouvelles données
  const updateBalanceState = () => {
    const effectiveSub = getEffectiveSubscription(subscription);
    
    // Reset daily gains if balance is zero
    if (balance <= 0) {
      balanceManager.setDailyGains(0);
      localStorage.removeItem('dailyGains');
      localStorage.removeItem('dailyLimitReached');
      
      setBalanceState({
        dailyGains: 0,
        limitPercentage: 0,
        isLimitReached: false,
        isNearLimit: false,
        effectiveSubscription: effectiveSub,
        dailyLimit: SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5
      });
      
      return;
    }
    
    const todaysGains = balanceManager.getDailyGains();
    const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    const percentage = Math.min(100, (todaysGains / dailyLimit) * 100);
    
    setBalanceState({
      dailyGains: todaysGains,
      limitPercentage: percentage,
      isLimitReached: percentage >= 99,
      isNearLimit: percentage >= 85 && percentage < 99,
      effectiveSubscription: effectiveSub,
      dailyLimit
    });
  };

  // Initialiser l'état et configurer les écouteurs d'événements
  useEffect(() => {
    updateBalanceState();
    
    const handleBalanceUpdate = () => {
      updateBalanceState();
    };
    
    const handleDailyGainsUpdate = (event: CustomEvent) => {
      // Reset daily gains if balance is zero
      if (balance <= 0) {
        balanceManager.setDailyGains(0);
        updateBalanceState();
        return;
      }
      
      updateBalanceState();
      
      // Vérifier si la limite est atteinte et déclencher l'événement correspondant
      const { dailyGains } = event.detail || {};
      if (dailyGains) {
        const effectiveSub = getEffectiveSubscription(subscription);
        const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
        const percentage = Math.min(100, (dailyGains / dailyLimit) * 100);
        
        if (percentage >= 99) {
          window.dispatchEvent(new CustomEvent('daily:limit:reached', {
            detail: { 
              subscription: effectiveSub,
              dailyLimit,
              currentGains: dailyGains
            }
          }));
        } else if (percentage >= 85) {
          window.dispatchEvent(new CustomEvent('daily:limit:warning', {
            detail: { 
              subscription: effectiveSub,
              dailyLimit,
              currentGains: dailyGains,
              percentage
            }
          }));
        }
      }
    };
    
    // Écouter les événements de mise à jour
    window.addEventListener('balance:update', handleBalanceUpdate);
    window.addEventListener('daily:gains:update', handleDailyGainsUpdate);
    window.addEventListener('db:balance-updated', handleBalanceUpdate);
    
    // Écouter l'événement de restauration de solde
    const handleForceUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.newBalance) {
        updateBalanceState();
      }
    };
    window.addEventListener('balance:force-update', handleForceUpdate as EventListener);
    
    // Actualiser périodiquement
    const intervalId = setInterval(updateBalanceState, 30000);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate);
      window.removeEventListener('daily:gains:update', handleDailyGainsUpdate);
      window.removeEventListener('db:balance-updated', handleBalanceUpdate);
      window.removeEventListener('balance:force-update', handleForceUpdate as EventListener);
      clearInterval(intervalId);
    };
  }, [subscription, balance]);

  return balanceState;
};
