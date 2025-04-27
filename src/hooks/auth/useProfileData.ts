
import { useState, useCallback, useEffect } from 'react';
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
      console.log("Fetching profile data for user:", userId);
      
      // Try to get cached username first
      const cachedName = localStorage.getItem(`lastKnownUsername_${userId}`) || localStorage.getItem('lastKnownUsername');
      if (cachedName && cachedName !== 'Utilisateur' && cachedName !== 'utilisateur') {
        setUsername(cachedName);
        return;
      }
      
      // Get profile for welcome message
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
      }
        
      // Get user data
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
      }
      
      const user = data.user;
      
      if (!user) {
        throw new Error("Aucun utilisateur trouvé malgré une session valide");
      }
      
      const displayName = profileData?.full_name || 
                        user.user_metadata?.full_name || 
                        (user.email ? user.email.split('@')[0] : 'utilisateur');
      
      // Store username in localStorage for future use
      localStorage.setItem(`lastKnownUsername_${userId}`, displayName);
      localStorage.setItem('lastKnownUsername', displayName);
      
      setUsername(displayName);
      
      // Dispatch event to notify that username is loaded
      window.dispatchEvent(new CustomEvent('username:loaded', { 
        detail: { username: displayName }
      }));
      
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
