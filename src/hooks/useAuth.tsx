
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
    // Configuration simplifiée de l'authentification
    try {
      // Mettre en place l'écouteur d'état d'authentification
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      );
      
      // Vérifier la session existante
      const checkSession = async () => {
        try {
          const { data } = await supabase.auth.getSession();
          setUser(data?.session?.user ?? null);
        } catch (error) {
          console.error('Erreur lors de la récupération de la session:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      checkSession();
      
      // Nettoyage de l'abonnement
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      setIsLoading(false);
    }
  }, []);

  // Protection contre l'état de chargement infini
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
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  
  return context;
};

export default useAuth;
