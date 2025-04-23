
import { useEffect, useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import useUserDataSync from './useUserDataSync';
import { toast } from "@/components/ui/use-toast";
import balanceManager from "@/utils/balance/balanceManager";
import { UserData } from '@/types/userData';

export const useInitUserData = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const initializedRef = useRef(false);
  const { syncUserData } = useUserDataSync();
  
  useEffect(() => {
    const initialize = async () => {
      if (initializedRef.current) return;
      setIsInitializing(true);
      
      try {
        // Check for cached data first for instant UI update
        const cachedName = localStorage.getItem('lastKnownUsername');
        const cachedSubscription = localStorage.getItem('subscription');
        const cachedBalance = localStorage.getItem('currentBalance');
        
        if (cachedName) setUsername(cachedName);
        if (cachedSubscription) setSubscription(cachedSubscription);
        if (cachedBalance) setBalance(parseFloat(cachedBalance));
        
        // Check if we have an active session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Active session found, syncing user data...");
          const userId = session.user.id;
          
          // Nettoyer les données d'autres utilisateurs dans localStorage
          try {
            // Supprimer TOUTES les données de solde pour commencer avec un état propre
            const userSpecificKeyPrefix = `currentBalance_${userId}`;
            const statsKeyPrefix = `user_stats_${userId}`;
            
            // Pour les nouveaux utilisateurs, nettoyer toutes les données statistiques et de solde
            Object.keys(localStorage).forEach(key => {
              // Isoler les données en ne gardant que celles spécifiques à cet utilisateur
              if (
                (key.startsWith('currentBalance_') && !key.startsWith(userSpecificKeyPrefix)) ||
                (key.startsWith('lastKnownBalance_') && !key.includes(userId)) ||
                (key.startsWith('lastUpdatedBalance_') && !key.includes(userId)) ||
                (key.startsWith('user_stats_') && !key.startsWith(statsKeyPrefix))
              ) {
                localStorage.removeItem(key);
              }
            });
          } catch (e) {
            console.error('Error cleaning localStorage for user isolation:', e);
          }
          
          const syncSuccess = await syncUserData(true);
          
          if (!syncSuccess) {
            console.log("Initial sync failed, retrying once...");
            // Wait a bit and retry once
            setTimeout(async () => {
              await syncUserData(true);
              
              // Après la synchronisation, activer aussi les agents IA
              window.dispatchEvent(new CustomEvent('bot:status-change', {
                detail: { active: true, userId: session.user.id }
              }));
              
              // Initialiser le gestionnaire de solde avec l'ID utilisateur
              if (cachedBalance) {
                const parsedBalance = parseFloat(cachedBalance);
                if (!isNaN(parsedBalance)) {
                  balanceManager.forceBalanceSync(0, userId); // Forcer à 0 pour les nouveaux utilisateurs
                }
              }
            }, 1000);
          } else {
            // Activer les agents IA après une synchronisation réussie
            window.dispatchEvent(new CustomEvent('bot:status-change', {
              detail: { active: true, userId: session.user.id }
            }));
            
            // Initialiser le gestionnaire de solde avec l'ID utilisateur
            // Vérifier si c'est un nouvel utilisateur en regardant les données de l'utilisateur
            const { data: userBalanceData } = await supabase
              .from('user_balances')
              .select('balance, daily_session_count')
              .eq('id', userId)
              .single();
            
            const isLikelyNewUser = !userBalanceData || 
                                 (userBalanceData.balance === 0 && userBalanceData.daily_session_count === 0);
            
            if (isLikelyNewUser) {
              // Réinitialiser complètement les données pour les nouveaux utilisateurs
              balanceManager.forceBalanceSync(0, userId);
              
              // Nettoyer également les autres données de statistiques
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('user_stats_')) {
                  localStorage.removeItem(key);
                }
              });
            } else if (cachedBalance) {
              const parsedBalance = parseFloat(cachedBalance);
              if (!isNaN(parsedBalance)) {
                balanceManager.forceBalanceSync(parsedBalance, userId);
              }
            }
          }
        } else {
          console.log("No active session found during initialization");
          
          // Nettoyer toute donnée résiduelle pour éviter la contamination entre sessions
          try {
            const statsKeys = Object.keys(localStorage).filter(key => 
              key.startsWith('user_stats_') || 
              key.startsWith('currentBalance_') || 
              key.startsWith('lastKnownBalance_')
            );
            
            for (const key of statsKeys) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            console.error('Error cleaning localStorage for anonymous user:', e);
          }
        }
        
        initializedRef.current = true;
      } catch (error) {
        console.error("Error during data initialization:", error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initialize();
    
    // Listen for data update events
    const handleUserDataRefreshed = (event: any) => {
      const { username, subscription, balance, userData } = event.detail;
      if (username) setUsername(username);
      if (subscription) setSubscription(subscription);
      if (balance !== undefined) setBalance(parseFloat(String(balance)));
      if (userData) setUserData(userData);
    };
    
    window.addEventListener('user:refreshed', handleUserDataRefreshed);
    window.addEventListener('user:fast-init', handleUserDataRefreshed);
    
    return () => {
      window.removeEventListener('user:refreshed', handleUserDataRefreshed);
      window.removeEventListener('user:fast-init', handleUserDataRefreshed);
    };
  }, [syncUserData]);
  
  // Simplify the refreshData function to return a Promise<boolean>
  const refreshData = async () => {
    try {
      const success = await syncUserData(true);
      return success;
    } catch (error) {
      console.error("Error refreshing data:", error);
      return false;
    }
  };
  
  return {
    isInitializing,
    username,
    subscription,
    balance,
    userData,
    refreshData
  };
};

export default useInitUserData;
