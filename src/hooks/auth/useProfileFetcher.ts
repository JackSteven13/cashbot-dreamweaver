
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface UseProfileFetcherResult {
  username: string | null;
  fetchProfileData: (userId: string) => Promise<void>;
}

export const useProfileFetcher = (): UseProfileFetcherResult => {
  const [username, setUsername] = useState<string | null>(null);

  // Function for retrieving profile data
  const fetchProfileData = useCallback(async (userId: string) => {
    try {
      const response = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle() as any;
        
      const { data, error } = response;
      
      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }
      
      if (data) {
        setUsername(data.full_name || 'Utilisateur');
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, []);

  return {
    username,
    fetchProfileData
  };
};

export default useProfileFetcher;
