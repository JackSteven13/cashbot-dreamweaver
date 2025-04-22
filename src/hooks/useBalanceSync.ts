
import { useEffect, useState, useCallback } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const useBalanceSync = (userData: any, isPreloaded: boolean) => {
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<number>(Date.now());

  // Fonction pour récupérer le solde le plus récent depuis Supabase
  const fetchLatestBalance = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Erreur lors de la récupération du solde:', error);
        return null;
      }
      
      return data.balance;
    } catch (err) {
      console.error('Exception lors de la récupération du solde:', err);
      return null;
    }
  }, []);

  // Synchronisation initiale du solde
  useEffect(() => {
    if (!isPreloaded && userData && userData.id) {
      const userId = userData.id || userData.profile?.id;
      
      if (!userId) {
        console.error('ID utilisateur manquant pour la synchronisation du solde');
        return;
      }
      
      // Récupérer le solde local actuel
      const localBalance = balanceManager.getCurrentBalance();
      const databaseBalance = userData.balance || 0;
      
      console.log(`Synchronisation du solde: Local=${localBalance}, Database=${databaseBalance}`);
      
      // Utiliser le solde le plus élevé pour éviter les frustrations utilisateur
      const effectiveBalance = Math.max(localBalance, databaseBalance);
      
      // Forcer la synchronisation du solde
      balanceManager.forceBalanceSync(effectiveBalance, userId);
      
      // Déclencher un événement pour mettre à jour l'interface
      window.dispatchEvent(new CustomEvent('balance:force-update', {
        detail: { 
          newBalance: effectiveBalance,
          timestamp: Date.now(),
          userId: userId
        }
      }));
      
      setLastBalanceUpdate(Date.now());
      
      // Vérification de sécurité: si le solde de la base de données est beaucoup plus faible, 
      // synchroniser à nouveau après un délai pour confirmer
      if (localBalance > databaseBalance * 1.1 && localBalance - databaseBalance > 0.5) {
        setTimeout(async () => {
          const confirmedBalance = await fetchLatestBalance(userId);
          if (confirmedBalance !== null && confirmedBalance < localBalance) {
            // Si le solde de la base de données est toujours inférieur, mettre à jour
            // la base de données pour éviter la perte de progression
            try {
              await supabase
                .from('user_balances')
                .update({ balance: localBalance })
                .eq('id', userId);
                
              console.log(`Solde mis à jour dans Supabase: ${localBalance}€`);
            } catch (err) {
              console.error('Erreur lors de la mise à jour du solde dans Supabase:', err);
            }
          }
        }, 3000);
      }
    }
  }, [userData, isPreloaded, fetchLatestBalance]);

  // Mettre en place un listener pour les événements de mise à jour de solde
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      if (userData && event.detail) {
        const userId = userData.id || userData.profile?.id;
        const amount = event.detail.amount;
        const newBalance = event.detail.newBalance;
        
        if (userId && (amount || newBalance)) {
          setLastBalanceUpdate(Date.now());
        }
      }
    };
    
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
    };
  }, [userData]);

  return { lastBalanceUpdate, setLastBalanceUpdate, fetchLatestBalance };
};
