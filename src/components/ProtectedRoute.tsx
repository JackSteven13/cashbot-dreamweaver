
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCcw, LogOut } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { verifyAuth, forceSignOut } from "@/utils/authUtils";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authCheckFailed, setAuthCheckFailed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const checkAuth = async (isManualRetry = false) => {
    if (isManualRetry) {
      setIsRetrying(true);
      setAuthCheckFailed(false);
      setIsAuthenticated(null);
    }
    
    try {
      console.log(`Vérification d'authentification ${isManualRetry ? "manuelle" : "automatique"}`);
      
      const isAuthValid = await verifyAuth();
      
      if (!isAuthValid) {
        console.log("Échec d'authentification");
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        setIsRetrying(false);
        return;
      }
      
      // Get user data
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      
      if (!user) {
        throw new Error("Aucun utilisateur trouvé malgré une session valide");
      }
      
      console.log("Utilisateur authentifié:", user.id);
      
      // Get profile for welcome message
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
          
        const displayName = profileData?.full_name || 
                          user.user_metadata?.full_name || 
                          (user.email ? user.email.split('@')[0] : 'utilisateur');
        
        setUsername(displayName);
        setIsAuthenticated(true);
        setIsRetrying(false);
      } catch (profileError) {
        console.error("Erreur lors de la récupération du profil:", profileError);
        // Continue even if profile fails
        setIsAuthenticated(true);
        setIsRetrying(false);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification d'authentification:", error);
      setAuthCheckFailed(true);
      setIsAuthenticated(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Set timeout for initial auth check
    const initTimeout = setTimeout(() => {
      if (isMounted) {
        checkAuth();
      }
    }, 500);
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      console.log(`Changement d'état d'authentification:`, event);
      
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUsername(null);
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        const user = session.user;
        if (user) {
          setUsername(user.user_metadata?.full_name || user.email?.split('@')[0] || 'utilisateur');
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, [location.pathname]); 

  // Fonction pour effectuer une connexion propre
  const handleCleanLogin = () => {
    Promise.resolve(forceSignOut())
      .then(() => {
        console.log("Redirection vers la page de connexion");
        navigate('/login', { replace: true });
      })
      .catch((error) => {
        console.error("Erreur pendant la déconnexion propre:", error);
        navigate('/login', { replace: true });
      });
  };

  // Afficher un écran de récupération en cas d'échec
  if (authCheckFailed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23] text-white p-4">
        <div className="glass-panel p-6 rounded-xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-4">Problème de connexion</h2>
          <p className="mb-6">Nous n'arrivons pas à vérifier votre session. Cela peut être dû à:</p>
          
          <ul className="text-left mb-6 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Une connexion internet instable</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Une session expirée ou corrompue</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Un problème temporaire avec le service</span>
            </li>
          </ul>
          
          <div className="space-y-3">
            <button 
              onClick={() => checkAuth(true)}
              disabled={isRetrying}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Tentative en cours...
                </>
              ) : (
                <>
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Réessayer
                </>
              )}
            </button>
            
            <button 
              onClick={handleCleanLogin}
              className="w-full flex items-center justify-center px-4 py-2 bg-transparent border border-white/30 hover:bg-white/10 rounded transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se connecter à nouveau
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Afficher un loader pendant la vérification
  if (isAuthenticated === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        <span className="ml-2 text-blue-300 mt-4">Vérification de l'authentification...</span>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (isAuthenticated === false) {
    toast({
      title: "Accès refusé",
      description: "Vous devez être connecté pour accéder à cette page.",
      variant: "destructive"
    });
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si l'utilisateur est authentifié, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;
