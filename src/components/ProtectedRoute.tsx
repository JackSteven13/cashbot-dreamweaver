
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCcw, LogOut } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { verifyAndRepairAuth, forceSignOut } from "@/utils/authUtils";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authCheckFailed, setAuthCheckFailed] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const maxRetries = 3;

  const checkAuth = async (isManualRetry = false) => {
    if (isManualRetry) {
      setIsRetrying(true);
      setAuthCheckFailed(false);
      setIsAuthenticated(null);
    }
    
    try {
      console.log(`Authentication check ${isManualRetry ? "manual retry" : "attempt"} ${retryAttempts + 1}/${maxRetries}`);
      
      // Utiliser la fonction de vérification et réparation
      const isAuthValid = await verifyAndRepairAuth();
      
      if (!isAuthValid) {
        if (retryAttempts < maxRetries && !isManualRetry) {
          setRetryAttempts(prev => prev + 1);
          console.log(`Auth check retry ${retryAttempts + 1}/${maxRetries} scheduled`);
          setTimeout(() => checkAuth(), 1500 * (retryAttempts + 1)); // Backoff exponentiel
          return;
        }
        
        console.log("Authentication failed after max retries");
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
        setIsRetrying(false);
        return;
      }
      
      // Reset retry counter on success
      if (retryAttempts > 0) {
        setRetryAttempts(0);
      }
      
      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No user found despite valid session");
      }
      
      console.log("User authenticated:", user.id);
      
      // Get profile for welcome message
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError);
        }
          
        const displayName = profileData?.full_name || 
                           user.user_metadata?.full_name || 
                           (user.email ? user.email.split('@')[0] : 'utilisateur');
        
        setUsername(displayName);
        setIsAuthenticated(true);
        setIsRetrying(false);
        
        // Show welcome message only if user just logged in
        if (location.state?.justLoggedIn) {
          toast({
            title: `Bienvenue, ${displayName} !`,
            description: "Vous êtes maintenant connecté à votre compte CashBot.",
          });
        }
      } catch (profileError) {
        console.error("Error in profile fetch:", profileError);
        // Continue with authentication even if profile fetch fails
        setIsAuthenticated(true);
        setIsRetrying(false);
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      
      if (retryAttempts < maxRetries && !isManualRetry) {
        setRetryAttempts(prev => prev + 1);
        console.log(`Auth check retry ${retryAttempts + 1}/${maxRetries} scheduled`);
        setTimeout(() => checkAuth(), 1500 * (retryAttempts + 1)); // Backoff exponentiel
        return;
      }
      
      setAuthCheckFailed(true);
      setIsAuthenticated(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;
    
    // Réinitialiser l'état à chaque montage
    if (isMounted) {
      setAuthCheckFailed(false);
      setRetryAttempts(0);
      setIsAuthenticated(null);
    }
    
    // Effectuer la vérification d'authentification
    checkAuth();
    
    // Définir un timeout pour éviter un chargement infini
    authTimeout = setTimeout(() => {
      if (isAuthenticated === null && isMounted) {
        console.warn("Auth check timed out");
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
      }
    }, 12000); // Augmenté à 12s pour donner plus de temps sur les connexions mobiles lentes

    // Monitor authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setIsAuthenticated(false);
          setUsername(null);
        }
      } else if (session && session.user) {
        if (isMounted) {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', session.user.id)
              .maybeSingle();
              
            const displayName = profileData?.full_name || 
                               session.user.user_metadata?.full_name || 
                               (session.user.email ? session.user.email.split('@')[0] : 'utilisateur');
            setUsername(displayName);
            setIsAuthenticated(true);
          } catch (error) {
            console.error("Error updating username:", error);
            setIsAuthenticated(true);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, [location]); // Retirer retryAttempts des dépendances pour éviter les boucles

  // Fonction pour effectuer une connexion propre
  const handleCleanLogin = () => {
    forceSignOut().then(() => {
      // Nettoyer le stockage local pour éviter les conflits
      localStorage.clear();
      sessionStorage.clear();
      
      // Rediriger vers la page de connexion
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
        <span className="text-xs text-blue-200 mt-2">Cela peut prendre quelques instants...</span>
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
