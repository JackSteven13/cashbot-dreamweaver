
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';

interface UseAuthStateListenerParams {
  mountedRef: React.RefObject<boolean>;
  navigate: ReturnType<typeof useNavigate>;
}

export const useAuthStateListener = ({ mountedRef, navigate }: UseAuthStateListenerParams) => {
  const setupAuthListener = useCallback(() => {
    console.log("Setting up auth state listener for dashboard");
    
    // Setup auth state listener with improved resilience
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      
      console.log(`Auth state change: ${event}`);
      
      if (event === 'SIGNED_OUT') {
        console.log("User signed out, redirecting to login");
        navigate('/login', { replace: true });
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Token refreshed successfully");
        // Pas besoin de réinitialiser ici, juste reconnaître le rafraîchissement
      }
    });
    
    // Return cleanup function
    return () => {
      console.log("Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, [mountedRef, navigate]);
  
  return { setupAuthListener };
};
