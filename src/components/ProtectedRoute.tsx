
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
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || !session.user) {
          console.log('User not authenticated, redirecting to login');
          if (isMounted) {
            setIsAuthenticated(false);
          }
          return;
        }
        
        // Get profile for welcome message
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) {
          if (profileError.code !== 'PGRST116') { // Ignore not found errors
            console.error("Error fetching profile:", profileError);
          }
          
          // Try to create a profile if it doesn't exist
          if (profileError.code === 'PGRST116') {
            try {
              await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  full_name: session.user.email?.split('@')[0] || 'utilisateur',
                  email: session.user.email
                });
            } catch (insertError) {
              console.error("Error creating profile:", insertError);
            }
          }
        }
          
        const displayName = profileData?.full_name || session.user.email?.split('@')[0] || 'utilisateur';
        
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
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();

    // Monitor authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
            .single();
            
          const displayName = profileData?.full_name || session.user.email?.split('@')[0] || 'utilisateur';
          setUsername(displayName);
          setIsAuthenticated(true);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [location]);

  // Show loader during verification
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
