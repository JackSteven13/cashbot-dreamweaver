
import { useState, useRef, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { UserData } from '@/types/userData';
import { useInitialDataLoad } from './dashboard/initialization/useInitialDataLoad';
import { useDashboardEvents } from './dashboard/initialization/useDashboardEvents';
import { useDataRefresh } from './dashboard/initialization/useDataRefresh';
import { toast } from "@/components/ui/use-toast";

export const useInitUserData = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const initializedRef = useRef(false);
  const syncAttemptsRef = useRef(0);

  const { isInitializing: isDataInitializing, initializeData } = useInitialDataLoad();
  const refreshData = useDataRefresh();

  // Set up event listeners for user data updates
  useDashboardEvents(setUsername, setSubscription, setBalance, setUserData);

  useEffect(() => {
    const initialize = async () => {
      if (initializedRef.current) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log("Session active trouvée, initialisation des données pour:", session.user.id);
        try {
          await initializeData(session.user.id);
          
          // Force une première synchronisation après l'initialisation
          setTimeout(() => {
            refreshData().then(success => {
              if (!success && syncAttemptsRef.current < 2) {
                syncAttemptsRef.current++;
                console.log(`Nouvelle tentative de synchronisation (${syncAttemptsRef.current}/2)`);
                
                // Réessayer après un délai
                setTimeout(() => refreshData(), 1500);
              }
            });
          }, 500);
        } catch (error) {
          console.error("Erreur lors de l'initialisation des données:", error);
          toast({
            title: "Erreur d'initialisation",
            description: "Impossible de charger vos données. Veuillez rafraîchir la page.",
            variant: "destructive",
            duration: 5000,
          });
        }
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
  }, [initializeData, refreshData]);

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
