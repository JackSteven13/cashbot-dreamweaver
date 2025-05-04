
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session existante
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data?.session?.user || null);
      } catch (error) {
        console.error('Erreur lors de la récupération de la session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Configurer l'écouteur d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    getInitialSession();

    // Nettoyage de l'abonnement
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading };
};

export default useAuth;
