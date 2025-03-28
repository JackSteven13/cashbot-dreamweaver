
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface UseProfileDataResult {
  username: string | null;
  setUsername: (name: string | null) => void;
  fetchProfileData: (userId: string) => Promise<void>;
}

/**
 * Hook to handle profile data fetching
 */
export const useProfileData = (): UseProfileDataResult => {
  const [username, setUsername] = useState<string | null>(null);
  
  const fetchProfileData = useCallback(async (userId: string) => {
    try {
      // Get profile for welcome message
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();
        
      // Get user data
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      
      if (!user) {
        throw new Error("Aucun utilisateur trouvé malgré une session valide");
      }
      
      const displayName = profileData?.full_name || 
                        user.user_metadata?.full_name || 
                        (user.email ? user.email.split('@')[0] : 'utilisateur');
      
      setUsername(displayName);
    } catch (profileError) {
      console.error("Erreur lors de la récupération du profil:", profileError);
    }
  }, []);

  return {
    username,
    setUsername,
    fetchProfileData
  };
};

export default useProfileData;
