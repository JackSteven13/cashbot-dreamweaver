
import { useState, useEffect, createContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

// Créer le contexte avec une valeur par défaut appropriée
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
  const [isSessionChecked, setIsSessionChecked] = useState(false);

  useEffect(() => {
    // Important: configurer d'abord l'écouteur d'événements avant de vérifier la session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Changement d'état d'authentification: ${event}`);
        setUser(session?.user ?? null);
        
        // Si l'authentification vient de changer, marquer comme vérifié
        if (!isSessionChecked) {
          setIsLoading(false);
          setIsSessionChecked(true);
        }

        // Actions spécifiques selon l'événement
        if (event === 'SIGNED_IN') {
          console.log('Utilisateur connecté:', session?.user?.email);
        } else if (event === 'SIGNED_OUT') {
          console.log('Utilisateur déconnecté');
          // Nettoyer les données locales en cas de déconnexion
          localStorage.removeItem('subscription');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Jeton rafraîchi');
        }
      }
    );

    // Vérifier la session existante
    const getInitialSession = async () => {
      try {
        console.log("Vérification de la session initiale");
        
        const { data: { session } } = await supabase.auth.getSession();
        
        setUser(session?.user ?? null);
        
        // Une dernière vérification pour s'assurer que nous avons des détails valides
        if (session?.user && !user) {
          // Vérification supplémentaire pour s'assurer de la validité de la session
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la session:", error);
      } finally {
        // Marquer comme non chargement uniquement si nous n'avons pas déjà traité un événement d'authentification
        if (!isSessionChecked) {
          setIsLoading(false);
          setIsSessionChecked(true);
        }
      }
    };

    // Vérifier la session existante après avoir configuré l'écouteur
    getInitialSession();

    // Nettoyer l'abonnement lorsque le composant est démonté
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Pas de dépendances pour ne s'exécuter qu'une seule fois

  // Protection contre le blocage - si toujours en chargement après 5 secondes, forcer à false
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("Délai d'attente de vérification de session dépassé, passage en mode non chargement");
        setIsLoading(false);
        setIsSessionChecked(true);
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = createContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;
