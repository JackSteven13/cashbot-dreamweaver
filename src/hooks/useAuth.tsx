
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
    // Configuration ultra robuste de l'écouteur d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Événement d'authentification détecté: ${event}`);
        
        // Mettre à jour l'état en fonction de l'événement
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (session?.user) {
          setUser(session.user);
        }
        
        // Si nous avons un événement définitif, arrêter le chargement
        if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
          setIsLoading(false);
        }
      }
    );
    
    // Vérification initiale de la session avec gestion des erreurs
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erreur lors de la récupération de la session:", error);
          setUser(null);
        } else {
          setUser(data?.session?.user ?? null);
        }
        
        // Arrêter le chargement après la vérification initiale
        setIsLoading(false);
      } catch (err) {
        console.error("Exception lors de la vérification de session:", err);
        setUser(null);
        setIsLoading(false);
      }
    };
    
    // Exécuter la vérification après un court délai pour éviter les conflits
    setTimeout(checkSession, 100);

    // Nettoyage
    return () => {
      subscription.unsubscribe();
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
