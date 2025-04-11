
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour réconcilier et synchroniser les transactions
 */
export const useTransactionReconciliation = (userData: any, isLoading: boolean) => {
  const reconciliationPerformedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  
  // Réconcilier les transactions et le solde
  useEffect(() => {
    if (isLoading || reconciliationPerformedRef.current) {
      return;
    }
    
    // Obtenir l'ID utilisateur actuel
    const checkUserAndReconcile = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data?.session?.user?.id;
        
        if (!userId || userId === userIdRef.current) {
          return;
        }
        
        userIdRef.current = userId;
        
        // Éviter les réconciliations excessives
        if (!reconciliationPerformedRef.current && userData?.transactions) {
          reconciliationPerformedRef.current = true;
          
          // Déclencher l'événement de réconciliation
          window.dispatchEvent(new CustomEvent('transactions:reconcile', {
            detail: { userId }
          }));
          
          // Mettre à jour les transactions
          window.dispatchEvent(new CustomEvent('transactions:refresh', {
            detail: { userId }
          }));
        }
      } catch (error) {
        console.error("Error in transaction reconciliation:", error);
      }
    };
    
    checkUserAndReconcile();
    
    return () => {
      reconciliationPerformedRef.current = false;
    };
  }, [userData, isLoading]);
  
  return null;
};

export default useTransactionReconciliation;
