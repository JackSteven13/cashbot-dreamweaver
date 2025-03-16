
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authCheckFailed, setAuthCheckFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;
    
    const checkAuth = async () => {
      try {
        console.log("Checking authentication status");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking auth session:", error);
          if (isMounted) {
            setAuthCheckFailed(true);
            setIsAuthenticated(false);
          }
          return;
        }
        
        if (!session || !session.user) {
          console.log('User not authenticated, redirecting to login');
          if (isMounted) {
            setIsAuthenticated(false);
          }
          return;
        }
        
        console.log("User authenticated:", session.user.id);
        
        // Get profile for welcome message
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .maybeSingle();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError);
        }
          
        const displayName = profileData?.full_name || 
                           session.user.user_metadata?.full_name || 
                           (session.user.email ? session.user.email.split('@')[0] : 'utilisateur');
        
        if (isMounted) {
          setUsername(displayName);
          setIsAuthenticated(true);
          
          // Show welcome message only if user just logged in
          if (location.state?.justLoggedIn) {
            toast({
              title: `Bienvenue, ${displayName} !`,
              description: "Vous êtes maintenant connecté à votre compte CashBot.",
            });
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        if (isMounted) {
          setAuthCheckFailed(true);
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();
    
    // Set a timeout to prevent infinite loading
    authTimeout = setTimeout(() => {
      if (isAuthenticated === null && isMounted) {
        console.warn("Auth check timed out");
        setAuthCheckFailed(true);
        setIsAuthenticated(false);
      }
    }, 10000);

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
          // Update username when auth state changes
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
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, [location]);

  // Show loader during verification
  if (isAuthenticated === null) {
    if (authCheckFailed) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#0f0f23] text-white p-4">
          <p className="mb-4 text-center">Problème de vérification de l'authentification</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Retourner à la page de connexion
          </button>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f23]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        <span className="ml-2 text-blue-300">Vérification de l'authentification...</span>
      </div>
    );
  }

  // If user is not authenticated, redirect to login page
  if (isAuthenticated === false) {
    toast({
      title: "Accès refusé",
      description: "Vous devez être connecté pour accéder à cette page.",
      variant: "destructive"
    });
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If user is authenticated, show protected content
  return <>{children}</>;
};

export default ProtectedRoute;
