
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface UseAuthCheckProps {
  mountedRef: React.RefObject<boolean>;
}

export const useAuthCheck = ({ mountedRef }: UseAuthCheckProps) => {
  const checkAuth = useCallback(async () => {
    try {
      if (!mountedRef.current) return false;
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth check error:", error);
        throw error;
      }
      
      if (!data.session) {
        console.log("No active session found, redirecting to login");
        window.location.href = '/login';
        return false;
      }
      
      console.log("Auth check successful, session found");
      return true;
    } catch (error) {
      console.error("Error checking auth status:", error);
      toast({
        title: "Erreur d'authentification",
        description: "Veuillez vous reconnecter.",
        variant: "destructive"
      });
      return false;
    }
  }, [mountedRef]);
  
  return { checkAuth };
};

export default useAuthCheck;
