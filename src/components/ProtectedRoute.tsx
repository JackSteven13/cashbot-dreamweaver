
import { ReactNode, useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AuthRecoveryScreen from './auth/AuthRecoveryScreen';
import AuthLoadingScreen from './auth/AuthLoadingScreen';
import { forceSignOut } from '@/utils/auth/sessionUtils';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authCheckFailed, setAuthCheckFailed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const redirectInProgress = useRef(false);
  const authCheckAttempt = useRef(0);
  const maxRetries = 3;
  
  // Check auth on component mount
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const checkAuth = async () => {
      if (!isMounted) return;

      try {
        console.log(`Checking auth (attempt ${authCheckAttempt.current + 1}/${maxRetries})`);
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          if (isMounted) {
            setIsAuthenticated(false);
            setAuthCheckFailed(true);
          }
          return;
        }
        
        if (!data.session || !data.session.user) {
          console.log("No valid session found");
          if (isMounted) {
            setIsAuthenticated(false);
            setAuthCheckFailed(false); // Not a failure, just not authenticated
          }
          return;
        }
        
        // Session is valid, confirm authentication
        console.log("Valid session found");
        if (isMounted) {
          setIsAuthenticated(true);
          setAuthCheckFailed(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (isMounted) {
          setIsAuthenticated(false);
          setAuthCheckFailed(true);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };
    
    const startInitialCheck = () => {
      setIsCheckingAuth(true);
      authCheckAttempt.current = 0;
      checkAuth();
      
      // Set timeout for auth check
      timeoutId = setTimeout(() => {
        if (isMounted && isCheckingAuth) {
          console.log("Auth check timeout reached");
          setIsCheckingAuth(false);
          setAuthCheckFailed(true);
        }
      }, 8000);
    };
    
    // Start the initial check
    startInitialCheck();
    
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' && isMounted) {
        checkAuth();
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setIsAuthenticated(false);
      }
    });
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);
  
  // Handle auto-retry for failed auth checks
  useEffect(() => {
    let retryTimeoutId: NodeJS.Timeout;
    
    if (authCheckFailed && authCheckAttempt.current < maxRetries) {
      setIsRetrying(true);
      
      retryTimeoutId = setTimeout(async () => {
        authCheckAttempt.current++;
        setIsCheckingAuth(true);
        
        try {
          const { data, error } = await supabase.auth.getSession();
          
          if (error || !data.session) {
            setIsAuthenticated(false);
            setAuthCheckFailed(true);
          } else {
            setIsAuthenticated(true);
            setAuthCheckFailed(false);
          }
        } catch (error) {
          setIsAuthenticated(false);
          setAuthCheckFailed(true);
        } finally {
          setIsCheckingAuth(false);
          setIsRetrying(false);
        }
      }, 1500);
    }
    
    return () => {
      clearTimeout(retryTimeoutId);
    };
  }, [authCheckFailed]);
  
  // Handle clean logout for user recovery option
  const handleCleanLogin = async () => {
    if (redirectInProgress.current) return;
    
    redirectInProgress.current = true;
    
    try {
      await forceSignOut();
      
      setTimeout(() => {
        redirectInProgress.current = false;
        window.location.href = '/login';
      }, 300);
    } catch (error) {
      console.error("Error during clean logout:", error);
      redirectInProgress.current = false;
      window.location.href = '/login';
    }
  };
  
  // Show recovery screen if auth check failed after retries
  if (authCheckFailed && authCheckAttempt.current >= maxRetries) {
    return (
      <AuthRecoveryScreen 
        isRetrying={isRetrying}
        onRetry={() => {
          authCheckAttempt.current = 0;
          setIsCheckingAuth(true);
          setAuthCheckFailed(false);
          
          setTimeout(async () => {
            try {
              const { data } = await supabase.auth.getSession();
              setIsAuthenticated(!!data.session);
              setIsCheckingAuth(false);
            } catch {
              setIsAuthenticated(false);
              setIsCheckingAuth(false);
              setAuthCheckFailed(true);
            }
          }, 300);
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
    if (!redirectInProgress.current) {
      redirectInProgress.current = true;
      
      // Only show toast when coming from a protected route
      if (location.pathname !== '/' && location.pathname !== '/login') {
        toast({
          title: "Accès refusé",
          description: "Vous devez être connecté pour accéder à cette page.",
          variant: "destructive"
        });
      }
      
      // Reset flag after a delay
      setTimeout(() => {
        redirectInProgress.current = false;
      }, 500);
    }
    
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  // If authenticated, show protected content
  return <>{children}</>;
};

export default ProtectedRoute;
