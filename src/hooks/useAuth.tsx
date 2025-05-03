
import { useState, useEffect, createContext, ReactNode, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Établir l'écouteur d'authentification en premier
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Actions spécifiques selon l'événement
        if (event === 'SIGNED_IN') {
          console.log('Utilisateur connecté:', session?.user?.email);
        } else if (event === 'SIGNED_OUT') {
          console.log('Utilisateur déconnecté');
        }
      }
    );

    // Ensuite vérifier la session existante
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Erreur lors de la récupération de la session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Nettoyage à la désinscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Protection contre le blocage - forcer à false après 3 secondes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [isLoading]);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;
