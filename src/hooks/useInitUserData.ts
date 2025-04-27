
import { useEffect, useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useUserDataSync } from './dashboard/initialization/useUserDataSync';
import { toast } from "@/components/ui/use-toast";
import balanceManager from "@/utils/balance/balanceManager";
import { UserData } from '@/types/userData';
import { cleanOtherUserData } from '@/utils/balance/balanceStorage';

export const useInitUserData = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const initializedRef = useRef(false);
  const mountedRef = useRef(true);
  const { syncUserData } = useUserDataSync({ mountedRef });
  
  useEffect(() => {
    // Set mounted ref
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    const initialize = async () => {
      if (initializedRef.current) return;
      setIsInitializing(true);
      
      try {
        // Check for an active session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Active session found, user ID:", session.user.id);
          const userId = session.user.id;
          
          // Set the user ID in the balance manager
          balanceManager.setUserId(userId);
          
          // IMPORTANT: Nettoyer complètement les données d'autres utilisateurs
          cleanOtherUserData(userId);
          
          // Maintenant, on peut essayer de charger les données spécifiques à l'utilisateur
          const userSpecificKeys = {
            username: `lastKnownUsername_${userId}`,
            subscription: `subscription_${userId}`,
            balance: `lastKnownBalance_${userId}`
          };
          
          const cachedName = localStorage.getItem(userSpecificKeys.username);
          const cachedSubscription = localStorage.getItem(userSpecificKeys.subscription);
          const cachedBalance = localStorage.getItem(userSpecificKeys.balance);
          
          if (cachedName) setUsername(cachedName);
          if (cachedSubscription) setSubscription(cachedSubscription);
          if (cachedBalance) {
            const parsedBalance = parseFloat(cachedBalance);
            if (!isNaN(parsedBalance)) setBalance(parsedBalance);
          }
          
          console.log("Syncing user data for:", userId);
          const syncSuccess = await syncUserData();
          
          if (!syncSuccess) {
            console.log("Initial sync failed, retrying once...");
            // Wait a bit and retry once
            setTimeout(async () => {
              if (!mountedRef.current) return;
              await syncUserData();
              
              // Après la synchronisation, activer aussi les agents IA
              window.dispatchEvent(new CustomEvent('bot:status-change', {
                detail: { active: true, userId: session.user.id }
              }));
            }, 1000);
          } else {
            // Activer les agents IA après une synchronisation réussie
            window.dispatchEvent(new CustomEvent('bot:status-change', {
              detail: { active: true, userId: session.user.id }
            }));
            
            // Vérifier si c'est un nouvel utilisateur
            const { data: userBalanceData } = await supabase
              .from('user_balances')
              .select('balance, daily_session_count')
              .eq('id', userId)
              .single();
            
            const isLikelyNewUser = !userBalanceData || 
                                 (userBalanceData.balance === 0 && userBalanceData.daily_session_count === 0);
            
            if (isLikelyNewUser) {
              console.log("Utilisateur détecté comme nouveau, réinitialisation du solde");
              balanceManager.forceBalanceSync(0, userId);
            } else if (cachedBalance) {
              const parsedBalance = parseFloat(cachedBalance);
              if (!isNaN(parsedBalance)) {
                balanceManager.forceBalanceSync(parsedBalance, userId);
              }
            }
          }
        } else {
          console.log("No active session found during initialization");
          
          // Clean balance manager since no user is active
          balanceManager.setUserId('');
        }
        
        initializedRef.current = true;
      } catch (error) {
        console.error("Error during data initialization:", error);
      } finally {
        if (mountedRef.current) {
          setIsInitializing(false);
        }
      }
    };
    
    initialize();
    
    // Listen for data update events
    const handleUserDataRefreshed = (event: any) => {
      const { username, subscription, balance, userData, isNewUser, userId } = event.detail;
      
      // Only process events for the current user
      const currentUserId = localStorage.getItem('lastKnownUserId');
      if (userId && currentUserId && userId !== currentUserId) {
        console.log(`Ignored data refresh event for different user: ${userId}`);
        return;
      }
      
      if (username) setUsername(username);
      if (subscription) setSubscription(subscription);
      
      // Si nouvel utilisateur, forcer le solde à 0 quoi qu'il arrive
      if (isNewUser) {
        setBalance(0);
      } else if (balance !== undefined) {
        setBalance(parseFloat(String(balance)));
      }
      
      if (userData) setUserData(userData);
    };
    
    window.addEventListener('user:refreshed', handleUserDataRefreshed);
    window.addEventListener('user:fast-init', handleUserDataRefreshed);
    
    return () => {
      mountedRef.current = false;
      window.removeEventListener('user:refreshed', handleUserDataRefreshed);
      window.removeEventListener('user:fast-init', handleUserDataRefreshed);
    };
  }, [syncUserData]);
  
  // Simplify the refreshData function to return a Promise<boolean>
  const refreshData = async () => {
    try {
      const success = await syncUserData();
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
