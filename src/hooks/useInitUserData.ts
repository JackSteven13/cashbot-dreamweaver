
import { useEffect, useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import useUserDataSync from './useUserDataSync';
import { toast } from "@/components/ui/use-toast";

export const useInitUserData = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
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
          const syncSuccess = await syncUserData(true);
          
          if (!syncSuccess) {
            console.log("Initial sync failed, retrying once...");
            // Wait a bit and retry once
            setTimeout(async () => {
              await syncUserData(true);
            }, 1000);
          }
        } else {
          console.log("No active session found during initialization");
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
      const { username, subscription, balance } = event.detail;
      if (username) setUsername(username);
      if (subscription) setSubscription(subscription);
      if (balance !== undefined) setBalance(parseFloat(String(balance)));
    };
    
    window.addEventListener('user:refreshed', handleUserDataRefreshed);
    window.addEventListener('user:fast-init', handleUserDataRefreshed);
    
    return () => {
      window.removeEventListener('user:refreshed', handleUserDataRefreshed);
      window.removeEventListener('user:fast-init', handleUserDataRefreshed);
    };
  }, [syncUserData]);
  
  return {
    isInitializing,
    username,
    subscription,
    balance,
    refreshData: () => syncUserData(true)
  };
};

export default useInitUserData;
