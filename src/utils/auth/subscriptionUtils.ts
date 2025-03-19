
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Handles user subscription-related utilities
 */

/**
 * Performs a proper logout, clearing both Supabase session and local storage
 * @returns Promise<boolean> true if successful, false otherwise
 */
export const logoutUser = async (): Promise<boolean> => {
  try {
    // First, sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Error during sign out:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la déconnexion",
        variant: "destructive"
      });
      return false;
    }
    
    // Clear relevant localStorage items
    localStorage.removeItem('user_registered');
    localStorage.removeItem('username');
    localStorage.removeItem('user_balance');
    localStorage.removeItem('daily_session_count');
    localStorage.removeItem('subscription');
    
    console.log("User signed out successfully");
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    toast({
      title: "Erreur",
      description: "Une erreur est survenue lors de la déconnexion",
      variant: "destructive"
    });
    return false;
  }
};
