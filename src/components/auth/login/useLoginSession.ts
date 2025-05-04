
import { useState, useEffect } from 'react';
import { clearStoredAuthData } from "@/integrations/supabase/client";

export const useLoginSession = () => {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [lastLoggedInEmail, setLastLoggedInEmail] = useState<string | null>(null);
  
  useEffect(() => {
    // Clear auth data on login page load to ensure a clean start
    clearStoredAuthData();
    
    // Just retrieve the saved email
    const savedEmail = localStorage.getItem('last_logged_in_email');
    if (savedEmail) {
      setLastLoggedInEmail(savedEmail);
    }
    
    // Finish loading quickly
    setIsCheckingSession(false);
    
    // Failsafe to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsCheckingSession(false);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, []);

  return { isCheckingSession, lastLoggedInEmail };
};
