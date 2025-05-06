
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook simplifié pour gérer les vérifications après l'authentification
 */
export const useAuthProvider = () => {
  const auth = useAuth();
  const user = auth?.user || null;
  
  useEffect(() => {
    if (user) {
      console.log("Utilisateur authentifié dans useAuthProvider");
    }
  }, [user?.id]);
  
  return { user };
};

export default useAuthProvider;
