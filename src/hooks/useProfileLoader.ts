
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { fetchUserProfile } from '@/utils/userDataFetch';
import { toast } from "@/components/ui/use-toast";

export const useProfileLoader = () => {
  const [isNewUser, setIsNewUser] = useState(false);

  const loadUserProfile = async (userId: string, userEmail?: string | null) => {
    // Get user profile
    const profileData = await fetchUserProfile(userId, userEmail);
    
    if (!profileData) {
      console.log("Création d'un nouveau profil pour l'utilisateur");
      try {
        // Try to create a profile
        await supabase.rpc('create_profile', {
          user_id: userId,
          user_name: userEmail?.split('@')[0] || 'utilisateur',
          user_email: userEmail || ''
        });
      } catch (error) {
        console.error("Error creating profile with RPC:", error);
        // Direct attempt if RPC fails
        try {
          await supabase.from('profiles').insert({
            id: userId,
            full_name: userEmail?.split('@')[0] || 'utilisateur',
            email: userEmail
          });
        } catch (insertError) {
          console.error("Error with direct profile insertion:", insertError);
        }
      }
    }
    
    // Get updated profile
    const { data: refreshedProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error fetching profile:", profileError);
    }

    return refreshedProfile;
  };

  return {
    loadUserProfile,
    isNewUser,
    setIsNewUser
  };
};
