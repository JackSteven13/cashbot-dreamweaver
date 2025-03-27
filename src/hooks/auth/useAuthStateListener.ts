
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface UseAuthStateListenerOptions {
  onSignOut?: () => void;
  onTokenRefresh?: () => void;
  isMounted: React.RefObject<boolean>;
}

export const useAuthStateListener = ({ 
  onSignOut, 
  onTokenRefresh,
  isMounted
}: UseAuthStateListenerOptions) => {
  
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted.current) return;
      
      if (event === 'SIGNED_OUT') {
        console.log("Auth state change: signed out");
        onSignOut?.();
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Auth state change: token refreshed");
        onTokenRefresh?.();
      }
    });
    
    return () => { 
      subscription.unsubscribe();
    };
  }, [onSignOut, onTokenRefresh, isMounted]);
};

export default useAuthStateListener;
