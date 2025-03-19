
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAuthSession = () => {
  const [session, setSession] = useState(null);
  
  // Check for session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
        }
      );
      
      // Clean up subscription
      return () => {
        subscription.unsubscribe();
      };
    };
    
    checkSession();
  }, []);

  return { session };
};
