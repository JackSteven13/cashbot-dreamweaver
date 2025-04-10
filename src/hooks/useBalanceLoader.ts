
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserSession } from './useUserSession';
import { balanceManager } from '@/utils/balance/balanceManager';

export const useBalanceLoader = () => {
  const { session } = useUserSession();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Charger le solde depuis la base de données
  const loadBalance = async (userId: string) => {
    try {
      setIsUpdating(true);
      
      // Récupérer le solde depuis la base de données
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error("Error loading balance:", error);
        return;
      }
      
      if (data) {
        // Valeur depuis la base
        const dbBalance = data.balance || 0;
        
        // Initialiser le gestionnaire de solde
        balanceManager.initialize(dbBalance, userId);
        
        // Obtenir le solde du gestionnaire (peut être plus élevé si enregistré en localStorage)
        const managerBalance = balanceManager.getCurrentBalance();
        
        // Mettre à jour l'état
        setBalance(managerBalance);
        
        console.log(`[useBalanceLoader] Balance loaded for ${userId}: DB=${dbBalance}, Manager=${managerBalance}`);
      }
    } catch (error) {
      console.error("Error in useBalanceLoader:", error);
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };
  
  // Initialiser et s'abonner aux mises à jour du solde
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    if (session?.user?.id) {
      // Charger le solde initial
      loadBalance(session.user.id);
      
      // S'abonner aux mises à jour du gestionnaire de solde
      unsubscribe = balanceManager.subscribe((newBalance) => {
        console.log(`[useBalanceLoader] Balance updated to: ${newBalance}`);
        setBalance(newBalance);
      });
      
      // S'abonner aux événements de réinitialisation du solde
      const handleBalanceReset = (event: CustomEvent) => {
        if (event.detail?.userId === session.user.id) {
          loadBalance(session.user.id);
        }
      };
      
      window.addEventListener('balance:reset', handleBalanceReset as EventListener);
      return () => {
        if (unsubscribe) unsubscribe();
        window.removeEventListener('balance:reset', handleBalanceReset as EventListener);
      };
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [session?.user?.id]);
  
  return { balance, isLoading, isUpdating, loadBalance };
};
