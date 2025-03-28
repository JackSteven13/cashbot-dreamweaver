
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

export const useAuthStateListener = () => {
  const navigate = useNavigate();
  
  const setupAuthListener = useCallback(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener with improved error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        console.log("Auth state change: signed out");
        // Clear any cached user data from localStorage
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_session_count');
        localStorage.removeItem('user_balance');
        
        // Use setTimeout to avoid race conditions in auth state
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 500);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Auth state change: token refreshed");
        // No need to navigate, just log the event
      } else if (event === 'SIGNED_IN') {
        console.log("Auth state change: signed in");
        // Check if we're already on the dashboard to avoid redirect loops
        if (window.location.pathname === '/login') {
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 800);
        }
      }
    });
    
    return subscription;
  }, [navigate]);

  return { setupAuthListener };
};
