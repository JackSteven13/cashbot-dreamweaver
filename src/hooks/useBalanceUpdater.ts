
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import balanceManager from '@/utils/balance/balanceManager';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook pour synchroniser et mettre à jour le solde en temps réel
 * Assure que le solde est toujours à jour avec la base de données
 */
export const useBalanceUpdater = () => {
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const { user } = useAuth();

  // Synchroniser le solde avec la base de données
  useEffect(() => {
    if (!user) return;

    const userId = user.id;
    balanceManager.setUserId(userId);
    
    // Fonction pour synchroniser le solde
    const syncBalance = async () => {
      try {
        // Récupérer le solde depuis la base de données
        const { data, error } = await supabase
          .from('user_balances')
          .select('balance, updated_at')
          .eq('id', userId)
          .single();
          
        if (error) {
          console.error('Erreur lors de la récupération du solde:', error);
          return;
        }
        
        if (!data) return;
        
        const dbBalance = data.balance || 0;
        const localBalance = balanceManager.getCurrentBalance();
        
        // Comparer les soldes et utiliser le plus récent/élevé
        if (dbBalance > localBalance) {
          console.log(`Mise à jour du solde depuis la DB: ${localBalance} -> ${dbBalance}`);
          balanceManager.forceBalanceSync(dbBalance, userId);
          
          // Déclencher une mise à jour de l'interface
          window.dispatchEvent(new CustomEvent('balance:force-update', {
            detail: {
              newBalance: dbBalance,
              timestamp: Date.now()
            }
          }));
          
          setLastUpdateTime(Date.now());
        } else if (localBalance > dbBalance) {
          // Si le solde local est supérieur, mettre à jour la base de données
          console.log(`Mise à jour de la DB avec le solde local: ${dbBalance} -> ${localBalance}`);
          
          await supabase
            .from('user_balances')
            .update({ 
              balance: localBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        }
      } catch (error) {
        console.error('Erreur lors de la synchronisation du solde:', error);
      }
    };

    // Synchroniser immédiatement au chargement
    syncBalance();
    
    // Configurer un intervalle pour synchroniser périodiquement
    const intervalId = setInterval(syncBalance, 60000); // Toutes les minutes
    
    // Configurer des écouteurs d'événements pour les mises à jour
    const handleBalanceUpdate = () => {
      setLastUpdateTime(Date.now());
    };
    
    // Écouter les changements de visibilité (quand l'utilisateur revient sur l'app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncBalance();
      }
    };
    
    // Écouter également les mises à jour des statistiques pour assurer la cohérence
    const handleStatsUpdate = (e: Event) => {
      if (e instanceof CustomEvent && e.detail) {
        const { revenueCount } = e.detail;
        if (revenueCount && typeof revenueCount === 'number') {
          // Ici, on pourrait mettre à jour un état local pour la coordination
          console.log(`Stats update reçu: nouveaux revenus = ${revenueCount}`);
        }
      }
    };
    
    window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:force-update', handleBalanceUpdate as EventListener);
    window.addEventListener('stats:update', handleStatsUpdate as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Nettoyer
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:force-update', handleBalanceUpdate as EventListener);
      window.removeEventListener('stats:update', handleStatsUpdate as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Fonction pour forcer une mise à jour du solde
  const forceBalanceUpdate = async () => {
    if (!user) return;
    
    try {
      // Récupérer le solde depuis la base de données
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Erreur lors de la récupération du solde:', error);
        return;
      }
      
      if (data && typeof data.balance === 'number') {
        balanceManager.forceBalanceSync(data.balance, user.id);
        
        // Déclencher une mise à jour de l'interface
        window.dispatchEvent(new CustomEvent('balance:force-update', {
          detail: {
            newBalance: data.balance,
            timestamp: Date.now(),
            forceUpdate: true
          }
        }));
        
        setLastUpdateTime(Date.now());
        
        toast({
          title: "Solde mis à jour",
          description: "Votre solde a été actualisé avec succès.",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour forcée du solde:', error);
      
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre solde.",
        variant: "destructive"
      });
    }
  };

  // Adding updateBalance function to keep compatibility with useDashboardLogic
  const updateBalance = async (gain: number, report: string, forceUpdate: boolean = false) => {
    if (!user) return;
    
    try {
      // Use the balanceManager to update the balance locally
      balanceManager.updateBalance(gain);
      
      // Trigger an event to notify components about the balance change
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: { 
          amount: gain,
          timestamp: Date.now(),
          userId: user.id
        }
      }));
      
      setLastUpdateTime(Date.now());
      
      // If forceUpdate is true, also update from the database
      if (forceUpdate) {
        await forceBalanceUpdate();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du solde:', error);
    }
  };

  return { lastUpdateTime, forceBalanceUpdate, updateBalance };
};

export default useBalanceUpdater;
