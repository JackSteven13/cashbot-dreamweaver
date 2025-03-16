
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || !session.user) {
          console.log('Utilisateur non authentifié, redirection vers la page de connexion');
          setIsAuthenticated(false);
          return;
        }
        
        // Récupérer le profil pour afficher le message de bienvenue
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Erreur lors de la récupération du profil:", profileError);
        }
          
        const displayName = profileData?.full_name || session.user.email?.split('@')[0] || 'utilisateur';
        setUsername(displayName);
        setIsAuthenticated(true);
        
        // Afficher un message de bienvenue uniquement si l'utilisateur vient de se connecter
        // (détecté par le changement d'URL via location.state)
        if (location.state?.justLoggedIn) {
          toast({
            title: `Bienvenue, ${displayName} !`,
            description: "Vous êtes maintenant connecté à votre compte CashBot.",
          });
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Surveiller les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        // Mettre à jour le nom d'utilisateur lorsque l'état d'authentification change
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
          
        const displayName = profileData?.full_name || session.user.email?.split('@')[0] || 'utilisateur';
        setUsername(displayName);
        setIsAuthenticated(true);
      } else {
        setUsername(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [location]);

  // Afficher un loader pendant la vérification
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (isAuthenticated === false) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si l'utilisateur est authentifié, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;
