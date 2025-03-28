
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

export const useAuthStateListener = () => {
  const navigate = useNavigate();
  
  const setupAuthListener = useCallback(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener with improved error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth state change: ${event}`, session ? 'Session exists' : 'No session');
      
      if (event === 'SIGNED_OUT') {
        // Clear any cached user data from localStorage
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_session_count');
        localStorage.removeItem('user_balance');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.expires_at');
        localStorage.removeItem('supabase.auth.refresh_token');
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
        
        // Only redirect if we're not already on the login page
        if (window.location.pathname !== '/login') {
          console.log("Redirecting to login page after sign out");
          navigate('/login', { replace: true });
        }
      } else if (event === 'SIGNED_IN') {
        console.log("Auth state change: signed in");
        
        // Only redirect if we're on the login page
        if (window.location.pathname === '/login') {
          console.log("Redirecting to dashboard after sign in");
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 100);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Auth state change: token refreshed");
        // No navigation needed
      }
    });
    
    return subscription;
  }, [navigate]);

  return { setupAuthListener };
};
