
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Fetch or create user profile
 */
export const fetchUserProfile = async (userId: string, userEmail?: string | null) => {
  try {
    // Get user profile from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      
      // If no profile found, try to create one
      if (profileError.code === 'PGRST116') {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          try {
            // Try using RPC first
            const { error: createError } = await supabase
              .rpc('create_profile', {
                user_id: userData.user.id,
                user_name: userData.user.email?.split('@')[0] || 'utilisateur',
                user_email: userData.user.email || ''
              });
              
            if (createError) {
              console.error("Error creating profile with RPC:", createError);
              
              // Try direct insertion as fallback
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: userData.user.id,
                  full_name: userData.user.email?.split('@')[0] || 'utilisateur',
                  email: userData.user.email
                });
                
              if (insertError) {
                console.error("Error with direct profile insertion:", insertError);
                toast({
                  title: "Erreur de profil",
                  description: "Impossible de créer votre profil. Veuillez vous reconnecter.",
                  variant: "destructive"
                });
              }
            }
            
            // Fetch the newly created profile
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userData.user.id)
              .single();
              
            return newProfile;
          } catch (error) {
            console.error("Profile creation failed:", error);
          }
        }
      }
    }

    return profileData;
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    return null;
  }
};
