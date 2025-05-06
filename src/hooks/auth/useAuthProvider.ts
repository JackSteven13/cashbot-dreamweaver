
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook simplifié pour gérer les vérifications après l'authentification
 * Toutes les vérifications de sécurité des mots de passe ont été supprimées
 */
export const useAuthProvider = () => {
  const auth = useAuth();
  const user = auth?.user || null;
  
  // Pas besoin de vérifications supplémentaires
  useEffect(() => {
    if (user) {
      console.log("Utilisateur authentifié dans useAuthProvider");
    }
  }, [user?.id]);
  
  return { user };
};

export default useAuthProvider;
