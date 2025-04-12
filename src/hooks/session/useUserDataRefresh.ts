
import { useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";

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
      
      // Mise à jour immédiate de l'UI avec les données en cache
      const cachedName = localStorage.getItem('lastKnownUsername');
      const cachedSubscription = localStorage.getItem('subscription');
      
      if (cachedName) {
        // Dispatch un événement pour informer l'UI qu'une mise à jour est en cours
        window.dispatchEvent(new CustomEvent('user:refreshing', {
          detail: { 
            username: cachedName,
            subscription: cachedSubscription 
          }
        }));
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("No active session found");
        setIsRefreshing(false);
        return false;
      }
      
      // Get current user data
      const { data, error } = await supabase
        .from('user_balances')
        .select('subscription, balance')
        .eq('id', session.user.id)
        .single();
        
      if (error || !data) {
        console.error("Failed to fetch user data:", error);
        setIsRefreshing(false);
        return false;
      }
      
      // Update local storage with current data
      localStorage.setItem('subscription', data.subscription);
      if (data.balance !== undefined) {
        localStorage.setItem('currentBalance', data.balance.toString());
        localStorage.setItem('lastKnownBalance', data.balance.toString());
      }
      
      // Dispatch un événement pour informer l'UI que des données ont été mises à jour
      window.dispatchEvent(new CustomEvent('user:refreshed', {
        detail: { 
          subscription: data.subscription,
          balance: data.balance
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
