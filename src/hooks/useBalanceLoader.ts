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
      let highestLocalBalance = 0;
      
      // Vérifier si getHighestBalance existe et l'utiliser
      if (typeof balanceManager.getHighestBalance === 'function') {
        highestLocalBalance = balanceManager.getHighestBalance();
      } else {
        // Fallback si la méthode n'existe pas
        highestLocalBalance = parseFloat(localStorage.getItem('highest_balance') || '0');
      }
      
      // Collecter toutes les sources potentielles de solde
      const sources = [
        localBalance,
        highestLocalBalance,
        parseFloat(localStorage.getItem('currentBalance') || '0'),
        parseFloat(localStorage.getItem('lastKnownBalance') || '0'),
        parseFloat(localStorage.getItem('lastUpdatedBalance') || '0'),
        parseFloat(sessionStorage.getItem('currentBalance') || '0')
      ];
      
      // Filtrer les valeurs NaN et trouver le maximum
      const maxLocalBalance = Math.max(...sources.filter(val => !isNaN(val) && val > 0));
      
      // S'assurer que nous avons une valeur valide
      const validLocalBalance = maxLocalBalance > 0 ? maxLocalBalance : 0;
      
      console.log(`Solde local avant chargement: ${validLocalBalance}€ (record: ${highestLocalBalance}€)`);
      
      // Fetch balance from user_balances table instead of profiles
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', userId)
        .single();
      
      if (balanceError) {
        console.error("Error loading balance:", balanceError);
        
        // En cas d'erreur, utiliser le solde local s'il existe et est valide
        if (validLocalBalance > 0) {
          console.log(`Utilisation du solde local en cas d'erreur: ${validLocalBalance}€`);
          setIsBalanceLoaded(true);
          
          // Informer le système que les données utilisateur sont chargées avec le solde local
          window.dispatchEvent(new CustomEvent('user:data-loaded', { 
            detail: { balance: validLocalBalance, source: 'local-fallback' }
          }));
          
          return {
            balance: validLocalBalance,
            loaded: true
          };
        }
        
        return null;
      }
      
      // If balance exists, use it
      if (balanceData && typeof balanceData.balance === 'number') {
        // S'assurer que serverBalance est un nombre valide
        const serverBalance = balanceData.balance !== null && !isNaN(balanceData.balance) 
          ? parseFloat(balanceData.balance.toFixed(2)) 
          : 0;
        
        // Comparer avec le solde local et prendre le plus élevé
        const effectiveBalance = Math.max(serverBalance, validLocalBalance);
        
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
        
        // Persister dans toutes les sources pour éviter les pertes
        localStorage.setItem('lastKnownBalance', effectiveBalance.toString());
        localStorage.setItem('currentBalance', effectiveBalance.toString());
        localStorage.setItem('lastUpdatedBalance', effectiveBalance.toString());
        sessionStorage.setItem('currentBalance', effectiveBalance.toString());
        
        console.log(`Solde chargé: ${effectiveBalance}€ (serveur: ${serverBalance}€, local: ${validLocalBalance}€)`);
        setIsBalanceLoaded(true);
        
        // Store highest balance seen
        if (typeof balanceManager.updateHighestBalance === 'function') {
          balanceManager.updateHighestBalance(effectiveBalance);
        } else {
          // Fallback si la méthode n'existe pas
          localStorage.setItem('highest_balance', effectiveBalance.toString());
        }
        
        // Informer le système que les données utilisateur sont chargées
        window.dispatchEvent(new CustomEvent('user:data-loaded', { 
          detail: { 
            balance: effectiveBalance, 
            serverBalance, 
            localBalance: validLocalBalance, 
            source: 'server' 
          }
        }));
        
        return {
          balance: effectiveBalance,
          loaded: true
        };
      } else {
        console.log("No balance found, user might be new");
        
        // Si aucun solde serveur mais un solde local existe et est significatif
        if (validLocalBalance > 0.5) {
          console.log(`Utilisation du solde local existant: ${validLocalBalance}€`);
          setIsBalanceLoaded(true);
          setIsNewUser(false);
          
          // Informer le système que les données utilisateur sont chargées
          window.dispatchEvent(new CustomEvent('user:data-loaded', { 
            detail: { balance: validLocalBalance, source: 'local-only' }
          }));
          
          return {
            balance: validLocalBalance,
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
      return {
        balance: 0,
        loaded: false
      };
    } finally {
      setIsBalanceLoading(false);
    }
  }, [isBalanceLoading, setIsNewUser]);

  return { loadUserBalance, isBalanceLoaded, isBalanceLoading };
};

export default useBalanceLoader;
