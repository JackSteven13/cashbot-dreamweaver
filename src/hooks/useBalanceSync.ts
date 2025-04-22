
import { useEffect, useState, useCallback } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const useBalanceSync = (userData: any, isPreloaded: boolean) => {
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<number>(Date.now());
  const [lastServerSync, setLastServerSync] = useState<number>(0);
  const userId = userData?.id || userData?.profile?.id;

  // Fonction pour récupérer le solde le plus récent depuis Supabase
  const fetchLatestBalance = useCallback(async (userId: string) => {
    try {
      // Éviter les requêtes trop fréquentes à la base de données
      const now = Date.now();
      if (now - lastServerSync < 5000) { // Pas plus d'une fois toutes les 5 secondes
        console.log('Requête trop fréquente, utilisez le cache local');
        return null;
      }
      
      setLastServerSync(now);
      
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance, subscription, daily_session_count')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Erreur lors de la récupération du solde:', error);
        return null;
      }
      
      // Stocker aussi le nombre de sessions quotidiennes
      if (data.daily_session_count !== undefined) {
        localStorage.setItem('daily_session_count', data.daily_session_count.toString());
        
        // Si freemium et au moins une session, marquer la limite comme atteinte
        if (data.subscription === 'freemium' && data.daily_session_count >= 1) {
          localStorage.setItem('freemium_daily_limit_reached', 'true');
          localStorage.setItem('last_session_date', new Date().toDateString());
        }
      }
      
      return {
        balance: data.balance,
        subscription: data.subscription,
        dailySessionCount: data.daily_session_count
      };
    } catch (err) {
      console.error('Exception lors de la récupération du solde:', err);
      return null;
    }
  }, [lastServerSync]);

  // Synchronisation initiale du solde
  useEffect(() => {
    if (!isPreloaded && userData && userData.id) {
      const userId = userData.id || userData.profile?.id;
      
      if (!userId) {
        console.error('ID utilisateur manquant pour la synchronisation du solde');
        return;
      }
      
      const syncBalance = async () => {
        // Récupérer le solde local actuel
        const localBalance = balanceManager.getCurrentBalance();
        const databaseBalance = userData.balance || 0;
        
        console.log(`Synchronisation du solde: Local=${localBalance}, Database=${databaseBalance}`);
        
        // Utiliser le solde le plus élevé pour éviter les frustrations utilisateur
        const effectiveBalance = Math.max(localBalance, databaseBalance);
        
        // Vérifier si le solde local est zéro alors que le solde de base de données est positif
        if (localBalance === 0 && databaseBalance > 0) {
          console.log("Solde local à zéro, utilisation du solde de la base de données:", databaseBalance);
          
          // Forcer la synchronisation du solde
          balanceManager.forceBalanceSync(databaseBalance, userId);
          
          // Déclencher un événement pour mettre à jour l'interface
          window.dispatchEvent(new CustomEvent('balance:force-update', {
            detail: { 
              newBalance: databaseBalance,
              timestamp: Date.now(),
              userId: userId
            }
          }));
          
          setLastBalanceUpdate(Date.now());
        } 
        // Si local > DB, synchroniser la BD avec local
        else if (localBalance > databaseBalance) {
          console.log("Solde local supérieur, mise à jour de la base de données");
          
          try {
            await supabase
              .from('user_balances')
              .update({ balance: localBalance })
              .eq('id', userId);
              
            console.log(`Base de données mise à jour avec le solde local: ${localBalance}€`);
          } catch (err) {
            console.error('Erreur lors de la mise à jour du solde dans Supabase:', err);
          }
        }
        // Si local < DB mais non nul, garder le plus haut des deux
        else if (localBalance < databaseBalance && localBalance > 0) {
          console.log("Solde local inférieur mais non nul, mise à jour locale");
          
          // Forcer la synchronisation du solde
          balanceManager.forceBalanceSync(databaseBalance, userId);
          
          // Déclencher un événement pour mettre à jour l'interface
          window.dispatchEvent(new CustomEvent('balance:force-update', {
            detail: { 
              newBalance: databaseBalance,
              timestamp: Date.now(),
              userId: userId
            }
          }));
          
          setLastBalanceUpdate(Date.now());
        }
      };
      
      syncBalance();
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

  // Ajouter une synchronisation périodique avec la base de données
  useEffect(() => {
    if (!userData || !userData.id) return;
    
    const userId = userData.id || userData.profile?.id;
    if (!userId) return;
    
    const intervalId = setInterval(async () => {
      const result = await fetchLatestBalance(userId);
      
      if (result) {
        const localBalance = balanceManager.getCurrentBalance();
        
        // Si le solde de la BD est supérieur, utiliser celui-ci
        if (result.balance > localBalance) {
          console.log(`Mise à jour du solde depuis la BD: ${localBalance} → ${result.balance}`);
          balanceManager.forceBalanceSync(result.balance, userId);
          
          // Déclencher une mise à jour de l'interface
          window.dispatchEvent(new CustomEvent('balance:force-update', {
            detail: {
              newBalance: result.balance,
              timestamp: Date.now(),
              userId
            }
          }));
          
          setLastBalanceUpdate(Date.now());
        }
        // Si le solde local est supérieur, mettre à jour la BD
        else if (localBalance > result.balance) {
          console.log(`Mise à jour de la BD avec le solde local: ${result.balance} → ${localBalance}`);
          try {
            await supabase
              .from('user_balances')
              .update({ balance: localBalance })
              .eq('id', userId);
          } catch (error) {
            console.error("Erreur lors de la mise à jour du solde dans la BD:", error);
          }
        }
      }
    }, 30000); // Toutes les 30 secondes
    
    return () => clearInterval(intervalId);
  }, [userData, fetchLatestBalance]);

  return { lastBalanceUpdate, setLastBalanceUpdate, fetchLatestBalance };
};
