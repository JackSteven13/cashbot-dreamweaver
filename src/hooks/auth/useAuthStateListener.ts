
import { useCallback, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface UseAuthStateListenerProps {
  onSignOut: () => void;
  onTokenRefresh: () => void;
  isMounted: React.RefObject<boolean>;
}

/**
 * Hook to listen to Supabase auth state changes
 */
export const useAuthStateListener = ({
  onSignOut,
  onTokenRefresh,
  isMounted
}: UseAuthStateListenerProps) => {
  
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted.current) return;
      
      console.log(`Changement d'état d'authentification:`, event);
      
      if (event === 'SIGNED_OUT') {
        onSignOut();
      } else if (event === 'TOKEN_REFRESHED') {
        onTokenRefresh();
      }
    });

    return () => {
      console.log("Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, [onSignOut, onTokenRefresh, isMounted]);
};

export default useAuthStateListener;
