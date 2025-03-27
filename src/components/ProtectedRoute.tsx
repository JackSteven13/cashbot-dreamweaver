
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AuthRecoveryScreen from './auth/AuthRecoveryScreen';
import AuthLoadingScreen from './auth/AuthLoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authCheckFailed, setAuthCheckFailed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const redirectInProgress = useRef(false);
  const maxRetries = 3;
  const retryCount = useRef(0);
  
  // Simple auth check function
  const checkAuth = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setIsRetrying(true);
    }
    
    try {
      console.log(`Checking auth (${isRetry ? 'manual retry' : 'initial check'})`);
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        setIsAuthenticated(false);
        setAuthCheckFailed(true);
        setIsRetrying(false);
        return;
      }
      
      if (!data.session || !data.session.user) {
        console.log("No valid session found");
        setIsAuthenticated(false);
        setAuthCheckFailed(false); // Not a failure, just not authenticated
        setIsRetrying(false);
        return;
      }
      
      console.log("Valid session found, user authenticated");
      setIsAuthenticated(true);
      setAuthCheckFailed(false);
      setIsRetrying(false);
    } catch (error) {
      console.error("Error during auth check:", error);
      setIsAuthenticated(false);
      setAuthCheckFailed(true);
      setIsRetrying(false);
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  // Handle clean logout
  const handleCleanLogin = useCallback(() => {
    if (redirectInProgress.current) return;
    
    redirectInProgress.current = true;
    console.log("Redirecting to login page");
    
    // Clear any cached user data
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_session_count');
    localStorage.removeItem('user_balance');
    
    // Sign out and redirect
    supabase.auth.signOut().then(() => {
      setTimeout(() => {
        navigate('/login', { replace: true });
        redirectInProgress.current = false;
      }, 300);
    }).catch(() => {
      setTimeout(() => {
        navigate('/login', { replace: true });
        redirectInProgress.current = false;
      }, 300);
    });
  }, [navigate]);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        console.log("Auth state change: signed out");
        setIsAuthenticated(false);
      } else if (event === 'SIGNED_IN') {
        console.log("Auth state change: signed in");
        setIsAuthenticated(true);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Initial auth check
  useEffect(() => {
    setIsCheckingAuth(true);
    checkAuth();
    
    // Set timeout for auth check
    const timeoutId = setTimeout(() => {
      if (isCheckingAuth) {
        console.log("Auth check timeout reached");
        setIsCheckingAuth(false);
        setAuthCheckFailed(true);
      }
    }, 10000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [checkAuth]);

  // Auto-retry logic
  useEffect(() => {
    if (authCheckFailed && retryCount.current < maxRetries) {
      const timeoutId = setTimeout(() => {
        console.log(`Auto-retry auth check (${retryCount.current + 1}/${maxRetries})`);
        retryCount.current++;
        checkAuth(true);
      }, 2000);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [authCheckFailed, checkAuth]);

  // Show recovery screen if auth check failed after retries
  if (authCheckFailed && retryCount.current >= maxRetries) {
    return (
      <AuthRecoveryScreen 
        isRetrying={isRetrying}
        onRetry={() => {
          retryCount.current = 0;
          checkAuth(true);
        }}
        onCleanLogin={handleCleanLogin}
      />
    );
  }
  
  // Show loading screen while checking auth
  if (isCheckingAuth || isAuthenticated === null) {
    return <AuthLoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (isAuthenticated === false) {
    console.log("User is not authenticated, redirecting to login page");
    
    if (!redirectInProgress.current) {
      redirectInProgress.current = true;
      toast({
        title: "Accès refusé",
        description: "Vous devez être connecté pour accéder à cette page.",
        variant: "destructive"
      });
    }
    
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If authenticated, show protected content
  console.log("Authentication confirmed, rendering protected content");
  return <>{children}</>;
};

export default ProtectedRoute;
