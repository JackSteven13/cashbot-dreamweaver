
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useLoginSession = () => {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [lastLoggedInEmail, setLastLoggedInEmail] = useState<string | null>(null);
  
  // Check existing session on mount but don't auto-redirect to dashboard
  const checkExistingSession = async () => {
    setIsCheckingSession(true);
    
    try {
      // Force clear problematic stored sessions
      localStorage.removeItem('supabase.auth.token');
      
      // We still check for a session, but we won't redirect automatically
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session check error:", error);
        setIsCheckingSession(false);
        return;
      }
      
      // Even if we have a valid session, we don't redirect automatically anymore
      // The user must explicitly log in with credentials
      setIsCheckingSession(false);
      
      // Get last email for suggestion only
      const savedEmail = localStorage.getItem('last_logged_in_email');
      if (savedEmail) {
        setLastLoggedInEmail(savedEmail);
      }
    } catch (err) {
      console.error("Session check failed:", err);
      setIsCheckingSession(false);
    }
  };
  
  useEffect(() => {
    const sessionTimeout = setTimeout(() => {
      setIsCheckingSession(false);
    }, 3000); // Réduire le délai à 3 secondes max pour éviter un écran de chargement trop long
    
    checkExistingSession();
    
    return () => clearTimeout(sessionTimeout);
  }, []);

  return { isCheckingSession, lastLoggedInEmail };
};
