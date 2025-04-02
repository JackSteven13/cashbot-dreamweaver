
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
    
    // Référence pour éviter les redirections multiples
    const redirectingRef = { current: false };
    
    // Clear any existing subscriptions to prevent duplicates
    supabase.auth.onAuthStateChange(undefined);
    
    // Setup auth state listener with improved resilience
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      
      console.log(`Auth state change: ${event}`);
      
      if (event === 'SIGNED_OUT' && !redirectingRef.current) {
        console.log("User signed out, redirecting to login");
        redirectingRef.current = true;
        
        // Mettre un flag dans localStorage pour indiquer qu'une redirection est en cours
        localStorage.setItem('auth_redirecting', 'true');
        
        // Use a timeout to avoid immediate navigation that could conflict with other processes
        setTimeout(() => {
          if (mountedRef.current) {
            navigate('/login', { replace: true });
            
            // Une fois la redirection terminée, on peut réinitialiser notre flag
            setTimeout(() => {
              localStorage.removeItem('auth_redirecting');
              redirectingRef.current = false;
            }, 500);
          }
        }, 300);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Token refreshed successfully");
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
