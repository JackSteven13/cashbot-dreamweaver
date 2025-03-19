
import { toast } from "@/components/ui/use-toast";
import { updateSessionCount } from "@/utils/userBalanceUtils";
import { supabase } from "@/integrations/supabase/client";

export const useSessionCount = () => {
  // Increment session count
  const incrementSessionCount = async (dailySessionCount: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("No active session found");
        return false;
      }
      
      const userId = session.user.id;
      const newCount = dailySessionCount + 1;
      
      console.log("Incrementing session count from", dailySessionCount, "to", newCount);
      const success = await updateSessionCount(userId, newCount);
      return success ? newCount : false;
    } catch (error) {
      console.error("Error incrementing session count:", error);
      return false;
    }
  };

  return { incrementSessionCount };
};
