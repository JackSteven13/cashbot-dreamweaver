
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour gérer les vérifications après l'authentification
 * Version simplifiée sans la vérification de sécurité des mots de passe
 */
export const useAuthProvider = () => {
  const auth = useAuth();
  const user = auth?.user || null;
  
  // Vérifier uniquement que la session est bien établie
  useEffect(() => {
    if (user) {
      // Vérifier que la session est bien établie
      const checkSession = async () => {
        try {
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            console.warn("Session non détectée dans useAuthProvider malgré utilisateur présent");
            
            // Tenter de rafraîchir la session
            try {
              await supabase.auth.refreshSession();
              console.log("Session rafraîchie avec succès");
            } catch (err) {
              console.error("Échec du rafraîchissement de session:", err);
            }
          } else {
            console.log("Session valide détectée dans useAuthProvider");
          }
        } catch (error) {
          console.error("Erreur lors de la vérification de session:", error);
        }
      };
      
      checkSession();
    }
  }, [user?.id]);
  
  return { user };
};

export default useAuthProvider;
