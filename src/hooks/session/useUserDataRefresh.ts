
import { supabase } from "@/integrations/supabase/client";

export const useUserDataRefresh = () => {
  // Force refresh user data from server
  const refreshUserData = async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("No active session found");
        return false;
      }
      
      // Get current user data
      const { data, error } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', session.user.id)
        .single();
        
      if (error || !data) {
        console.error("Failed to fetch user data:", error);
        return false;
      }
      
      // Update local storage with current subscription
      localStorage.setItem('subscription', data.subscription);
      
      return true;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return false;
    }
  };

  return { refreshUserData };
};
