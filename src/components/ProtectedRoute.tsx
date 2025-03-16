
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        // Récupérer le profil pour afficher le message de bienvenue
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
          
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
      } else {
        console.log('Utilisateur non authentifié, redirection vers la page de connexion');
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Surveiller les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        setIsAuthenticated(true);
      } else {
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
