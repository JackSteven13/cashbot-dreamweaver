
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface UseAuthStateListenerParams {
  mountedRef: React.RefObject<boolean>;
}

export const useAuthStateListener = ({ mountedRef }: UseAuthStateListenerParams) => {
  const setupAuthListener = useCallback(() => {
    console.log("Setting up auth state listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mountedRef.current) return;
        
        if (session) {
          console.log("Auth state changed: User is signed in");
          // Dispatch a global event that other components can listen to
          window.dispatchEvent(new CustomEvent('user:session-changed', {
            detail: { signedIn: true, user: session.user }
          }));
        } else {
          console.log("Auth state changed: User is signed out");
          window.dispatchEvent(new CustomEvent('user:session-changed', {
            detail: { signedIn: false }
          }));
        }
      }
    );
    
    // Return cleanup function to unsubscribe
    return () => {
      console.log("Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, [mountedRef]);

  return { setupAuthListener };
};

export default useAuthStateListener;
