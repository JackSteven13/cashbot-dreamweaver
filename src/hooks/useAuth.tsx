
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
    // Variable pour suivre si le composant est toujours monté
    let mounted = true;
    
    // Configuration de l'écouteur d'authentification en premier
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log(`Événement d'authentification détecté: ${event}`);
          } else if (event === 'SIGNED_OUT') {
            console.log('Déconnexion détectée, mise à jour de l\'état');
          }
          
          // Mise à jour synchrone du state
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      }
    );
    
    // Vérification initiale de la session
    const checkSession = async () => {
      try {
        // Attente courte pour éviter les conditions de course potentielles
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erreur lors de la récupération de la session:', error);
          if (mounted) setIsLoading(false);
          return;
        }
        
        if (mounted) {
          setUser(data?.session?.user ?? null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Exception lors de la récupération de la session:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Démarrer la vérification de session
    checkSession();
    
    // Nettoyage à la destruction du composant
    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

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
