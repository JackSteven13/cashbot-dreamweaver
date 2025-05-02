
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { checkPasswordSecurity } from '@/utils/auth/securityUtils';

/**
 * Hook pour gérer les vérifications de sécurité après l'authentification
 */
export const useAuthProvider = () => {
  const { user } = useAuth();
  
  // Effectuer des vérifications de sécurité après connexion
  useEffect(() => {
    if (user) {
      // Vérifier la sécurité du mot de passe
      checkPasswordSecurity(user);
    }
  }, [user?.id]);
  
  return { user };
};

export default useAuthProvider;
