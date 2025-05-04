
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
    // Configuration initiale pour la détection des problèmes réseaux
    console.log("État de la connexion:", navigator.onLine ? "En ligne" : "Hors ligne");
    
    // Écouteur d'état d'authentification avec gestion améliorée des erreurs
    try {
      // Mettre en place l'écouteur d'état d'authentification en premier
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log(`Changement d'état d'authentification: ${event}`);
          
          // Gestion synchrone de l'état utilisateur pour éviter les blocages
          setUser(session?.user ?? null);
          setIsLoading(false);
          
          // Enregistrement des événements d'authentification
          if (event === 'SIGNED_IN') {
            console.log("Utilisateur connecté:", session?.user?.email);
          } else if (event === 'SIGNED_OUT') {
            console.log("Utilisateur déconnecté");
          } else if (event === 'TOKEN_REFRESHED') {
            console.log("Token d'authentification rafraîchi");
          }
        }
      );
      
      // Vérifier la session existante après avoir configuré l'écouteur
      const checkSession = async () => {
        try {
          // Utiliser un délai court pour éviter les problèmes de blocage
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const { data: { session } } = await supabase.auth.getSession();
          setUser(session?.user ?? null);
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
      console.error("Erreur lors de l'initialisation du contexte d'authentification:", error);
      setIsLoading(false);
    }
  }, []);

  // Protection contre l'état de chargement infini
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("Timeout de sécurité atteint pour le chargement de l'authentification");
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
