
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

export const useAuthStateListener = () => {
  const navigate = useNavigate();
  
  const setupAuthListener = useCallback(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        console.log("Auth state change: signed out");
        // Clear any cached user data from localStorage
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_session_count');
        localStorage.removeItem('user_balance');
        
        navigate('/login', { replace: true });
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Auth state change: token refreshed");
        // No need to reinitialize here, just acknowledge the refresh
      } else if (event === 'SIGNED_IN') {
        console.log("Auth state change: signed in");
        // Don't navigate here, let the normal flow handle it
      }
    });
    
    return subscription;
  }, [navigate]);

  return { setupAuthListener };
};
