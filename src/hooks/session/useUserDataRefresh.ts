
import { useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import balanceManager from '@/utils/balance/balanceManager';

export const useUserDataRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTime = useRef(0);
  const refreshDebounceTime = 1000; // 1 seconde minimum entre les rafraîchissements
  
  // Force refresh user data from server with debouncing
  const refreshUserData = useCallback(async (): Promise<boolean> => {
    // Empêcher les rafraîchissements trop fréquents
    const now = Date.now();
    if (now - lastRefreshTime.current < refreshDebounceTime) {
      console.log("Rafraîchissement demandé trop tôt, on attend...");
      
      // Nettoyer tout timer existant
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Programmer un rafraîchissement après le délai
      return new Promise((resolve) => {
        refreshTimeoutRef.current = setTimeout(async () => {
          const result = await refreshUserData();
          resolve(result);
        }, refreshDebounceTime - (now - lastRefreshTime.current));
      });
    }
    
    // Éviter les multiples rafraîchissements simultanés
    if (isRefreshing) {
      console.log("Rafraîchissement déjà en cours, ignoré");
      return false;
    }
    
    try {
      setIsRefreshing(true);
      lastRefreshTime.current = Date.now();
      
      // Récupérer la session utilisateur actuelle
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("No active session found");
        setIsRefreshing(false);
        return false;
      }
      
      const userId = session.user.id;
      const userSpecificKeys = {
        username: `lastKnownUsername_${userId}`,
        subscription: `subscription_${userId}`,
        balance: `lastKnownBalance_${userId}`
      };
      
      // Mise à jour immédiate de l'UI avec les données en cache
      const cachedName = localStorage.getItem(userSpecificKeys.username);
      const cachedSubscription = localStorage.getItem(userSpecificKeys.subscription);
      const cachedBalance = localStorage.getItem(userSpecificKeys.balance);
      
      // Récupérer d'abord le solde local actuel du gestionnaire
      const currentBalance = balanceManager.getCurrentBalance();
      
      if (cachedName) {
        // Dispatch un événement pour informer l'UI qu'une mise à jour est en cours
        window.dispatchEvent(new CustomEvent('user:refreshing', {
          detail: { 
            username: cachedName,
            subscription: cachedSubscription,
            balance: isNaN(currentBalance) ? cachedBalance : currentBalance.toString(),
            userId
          }
        }));
      }
      
      // Get current user data
      const { data, error } = await supabase
        .from('user_balances')
        .select('subscription, balance')
        .eq('id', userId)
        .single();
        
      if (error || !data) {
        console.error("Failed to fetch user data:", error);
        setIsRefreshing(false);
        return false;
      }
      
      // Update local storage with current data using user-specific keys
      localStorage.setItem(userSpecificKeys.subscription, data.subscription);
      
      // Comparer le solde du serveur avec le solde local et prendre le plus élevé
      if (data.balance !== undefined && !isNaN(data.balance)) {
        // Collecter toutes les sources potentielles de solde
        const sources = [
          data.balance,
          currentBalance,
          parseFloat(localStorage.getItem(`currentBalance_${userId}`) || '0'),
          parseFloat(localStorage.getItem(userSpecificKeys.balance) || '0'),
          parseFloat(localStorage.getItem(`lastUpdatedBalance_${userId}`) || '0'),
          parseFloat(sessionStorage.getItem(`currentBalance_${userId}`) || '0')
        ];
        
        // Filtrer les valeurs NaN et trouver le maximum
        const maxBalance = Math.max(...sources.filter(val => !isNaN(val) && val > 0));
        
        if (maxBalance > 0) {
          localStorage.setItem(`currentBalance_${userId}`, maxBalance.toString());
          localStorage.setItem(userSpecificKeys.balance, maxBalance.toString());
          localStorage.setItem(`lastUpdatedBalance_${userId}`, maxBalance.toString());
          sessionStorage.setItem(`currentBalance_${userId}`, maxBalance.toString());
          
          // Mettre à jour le gestionnaire de solde
          if (maxBalance > currentBalance || isNaN(currentBalance)) {
            balanceManager.forceBalanceSync(maxBalance, userId);
          }
          
          console.log(`Data refreshed event received for ${userId}: { balance: ${maxBalance}, subscription: ${data.subscription} }`);
        }
      }
      
      // Dispatch un événement pour informer l'UI que des données ont été mises à jour
      window.dispatchEvent(new CustomEvent('user:refreshed', {
        detail: { 
          subscription: data.subscription,
          balance: data.balance,
          userId
        }
      }));
      
      setIsRefreshing(false);
      return true;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      setIsRefreshing(false);
      return false;
    }
  }, [isRefreshing]);

  return { refreshUserData, isRefreshing };
};

export default useUserDataRefresh;
