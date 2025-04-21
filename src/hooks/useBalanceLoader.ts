import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import balanceManager from '@/utils/balance/balanceManager';

export const useBalanceLoader = (setIsNewUser: (isNew: boolean) => void) => {
  const [isBalanceLoaded, setIsBalanceLoaded] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  const loadUserBalance = useCallback(async (userId: string) => {
    if (isBalanceLoading) return null;
    
    try {
      setIsBalanceLoading(true);
      console.log("Loading balance for user:", userId);
      
      // Récupérer le solde local avant toute opération réseau
      const localBalance = balanceManager.getCurrentBalance();
      const highestLocalBalance = balanceManager.getHighestBalance();
      
      console.log(`Solde local avant chargement: ${localBalance}€ (record: ${highestLocalBalance}€)`);
      
      // Fetch balance from user_balances table instead of profiles
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', userId)
        .single();
      
      if (balanceError) {
        console.error("Error loading balance:", balanceError);
        
        // En cas d'erreur, utiliser le solde local s'il existe
        if (localBalance > 0) {
          console.log(`Utilisation du solde local en cas d'erreur: ${localBalance}€`);
          setIsBalanceLoaded(true);
          
          // Informer le système que les données utilisateur sont chargées avec le solde local
          window.dispatchEvent(new CustomEvent('user:data-loaded', { 
            detail: { balance: localBalance, source: 'local-fallback' }
          }));
          
          return {
            balance: localBalance,
            loaded: true
          };
        }
        
        return null;
      }
      
      // If balance exists, use it
      if (balanceData && typeof balanceData.balance === 'number') {
        const serverBalance = parseFloat(balanceData.balance.toFixed(2));
        
        // Comparer avec le solde local et prendre le plus élevé
        const effectiveBalance = Math.max(serverBalance, localBalance);
        
        // If balance is zero or very low, might be a new user
        if (effectiveBalance <= 0.1) {
          console.log("User appears to be new (zero or very low balance)");
          setIsNewUser(true);
        } else {
          setIsNewUser(false);
        }
        
        // Informer balanceManager du solde du serveur pour comparaison
        balanceManager.checkForSignificantBalanceChange(serverBalance);
        
        // Synchronize with balance manager, always keeping the highest value
        balanceManager.forceBalanceSync(effectiveBalance, userId);
        
        console.log(`Solde chargé: ${effectiveBalance}€ (serveur: ${serverBalance}€, local: ${localBalance}€)`);
        setIsBalanceLoaded(true);
        
        // Store highest balance seen
        balanceManager.updateHighestBalance(effectiveBalance);
        
        // Informer le système que les données utilisateur sont chargées
        window.dispatchEvent(new CustomEvent('user:data-loaded', { 
          detail: { balance: effectiveBalance, serverBalance, localBalance, source: 'server' }
        }));
        
        return {
          balance: effectiveBalance,
          loaded: true
        };
      } else {
        console.log("No balance found, user might be new");
        
        // Si aucun solde serveur mais un solde local existe et est significatif
        if (localBalance > 0.5) {
          console.log(`Utilisation du solde local existant: ${localBalance}€`);
          setIsBalanceLoaded(true);
          setIsNewUser(false);
          
          // Informer le système que les données utilisateur sont chargées
          window.dispatchEvent(new CustomEvent('user:data-loaded', { 
            detail: { balance: localBalance, source: 'local-only' }
          }));
          
          return {
            balance: localBalance,
            loaded: true
          };
        } else {
          setIsNewUser(true);
          return {
            balance: 0,
            loaded: false
          };
        }
      }
    } catch (error) {
      console.error("Error in loadUserBalance:", error);
      return null;
    } finally {
      setIsBalanceLoading(false);
    }
  }, [isBalanceLoading, setIsNewUser]);

  return { loadUserBalance, isBalanceLoaded, isBalanceLoading };
};

export default useBalanceLoader;
