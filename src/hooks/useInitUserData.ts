
import { useState, useRef, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { UserData } from '@/types/userData';
import { useInitialDataLoad } from './dashboard/initialization/useInitialDataLoad';
import { useDashboardEvents } from './dashboard/initialization/useDashboardEvents';
import { useDataRefresh } from './dashboard/initialization/useDataRefresh';

export const useInitUserData = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const initializedRef = useRef(false);

  const { isInitializing: isDataInitializing, initializeData } = useInitialDataLoad();
  const refreshData = useDataRefresh();

  // Set up event listeners for user data updates
  useDashboardEvents(setUsername, setSubscription, setBalance, setUserData);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await initializeData(session.user.id);
      } else {
        console.log("No active session found during initialization");
        
        try {
          const statsKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('user_stats_') || 
            key.startsWith('currentBalance_') || 
            key.startsWith('lastKnownBalance_') ||
            key.startsWith('lastUpdatedBalance_') ||
            key.startsWith('highest_balance_') ||
            key.startsWith('lastKnownUsername_') ||
            key === 'currentBalance' ||
            key === 'lastKnownBalance' ||
            key === 'lastUpdatedBalance' ||
            key === 'lastKnownUsername'
          );
          
          for (const key of statsKeys) {
            localStorage.removeItem(key);
          }
          
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('currentBalance_') || key === 'currentBalance') {
              sessionStorage.removeItem(key);
            }
          });
        } catch (e) {
          console.error('Error cleaning localStorage for anonymous user:', e);
        }
      }
      
      initializedRef.current = true;
      setIsInitializing(false);
    };
    
    initialize();
  }, [initializeData]);

  return {
    isInitializing: isInitializing || isDataInitializing,
    username,
    subscription,
    balance,
    userData,
    isNewUser,
    refreshData
  };
};

export default useInitUserData;
