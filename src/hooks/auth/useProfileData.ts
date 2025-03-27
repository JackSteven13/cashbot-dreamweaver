
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useProfileData = () => {
  const [username, setUsername] = useState<string | null>(null);
  
  const fetchProfileData = useCallback(async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileData?.full_name) {
        setUsername(profileData.full_name);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  }, []);
  
  return {
    username,
    setUsername,
    fetchProfileData
  };
};

export default useProfileData;
