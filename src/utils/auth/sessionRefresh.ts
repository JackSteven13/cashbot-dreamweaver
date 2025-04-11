
import { supabase } from "@/integrations/supabase/client";

/**
 * Refreshes the current user session token
 * @returns The refreshed session or null if refresh failed
 */
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Error refreshing session:", error);
      return null;
    }
    
    return data.session;
  } catch (e) {
    console.error("Exception during session refresh:", e);
    return null;
  }
};
