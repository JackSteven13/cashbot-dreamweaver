
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour réconcilier et synchroniser les transactions
 */
export const useTransactionReconciliation = (userData: any, isLoading: boolean) => {
  const reconciliationPerformedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  
  // Réconcilier les transactions et le solde
  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (isLoading) {
      return;
    }
    
    // Éviter les réconciliations excessives
    if (reconciliationPerformedRef.current) {
      return;
    }

    // Utiliser un timeout pour limiter les réconciliations
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Obtenir l'ID utilisateur actuel et réconcilier avec un délai
    const checkUserAndReconcile = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data?.session?.user?.id;
        
        if (!userId) {
          return;
        }
        
        // Ne pas réexécuter si l'ID utilisateur est le même
        if (userId === userIdRef.current) {
          return;
        }
        
        userIdRef.current = userId;
        
        // Marquer comme réconcilié pour éviter les appels répétés
        reconciliationPerformedRef.current = true;
        
        console.log("Démarrage de la réconciliation des transactions...");
        
        // Déclencher l'événement de réconciliation
        window.dispatchEvent(new CustomEvent('transactions:reconcile', {
          detail: { userId }
        }));
        
        // Mettre à jour les transactions
        window.dispatchEvent(new CustomEvent('transactions:refresh', {
          detail: { userId }
        }));
      } catch (error) {
        console.error("Error in transaction reconciliation:", error);
      }
    };
    
    // Ajouter un délai pour éviter les appels trop fréquents
    timeoutRef.current = window.setTimeout(checkUserAndReconcile, 1000);
    
    return () => {
      // Nettoyage: annuler le timeout si le composant est démonté
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [userData, isLoading]);
  
  // Réinitialiser le flag de réconciliation lors des changements significatifs
  useEffect(() => {
    // Réinitialiser si les transactions changent
    if (userData?.transactions?.length) {
      reconciliationPerformedRef.current = false;
    }
    
    return () => {
      // Nettoyage complet lors du démontage
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [userData?.transactions?.length]);
  
  return null;
};

export default useTransactionReconciliation;
