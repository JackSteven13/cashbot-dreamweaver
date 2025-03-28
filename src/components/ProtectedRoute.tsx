
import { ReactNode, useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AuthRecoveryScreen from './auth/AuthRecoveryScreen';
import AuthLoadingScreen from './auth/AuthLoadingScreen';
import { verifyAuth } from '@/utils/auth/verificationUtils';
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
  const authCheckAttempt = useRef(0);
  const isMounted = useRef(true);
  const maxRetries = 3;
  
  // Check auth on component mount
  useEffect(() => {
    isMounted.current = true;
    let timeoutId: NodeJS.Timeout;
    
    const checkAuth = async () => {
      if (!isMounted.current) return;
      
      console.log(`ProtectedRoute: Checking auth (attempt ${authCheckAttempt.current + 1}/${maxRetries})`);
      
      try {
        // Use verifyAuth for improved verification
        const isAuthValid = await verifyAuth();
        
        if (!isAuthValid) {
          console.log("ProtectedRoute: No valid session found");
          if (isMounted.current) {
            setIsAuthenticated(false);
          }
          return;
        }
        
        // Session is valid, confirm authentication
        console.log("ProtectedRoute: Valid session found");
        if (isMounted.current) {
          setIsAuthenticated(true);
          setAuthCheckFailed(false);
        }
      } catch (error) {
        console.error("ProtectedRoute: Auth check error:", error);
        if (isMounted.current) {
          if (authCheckAttempt.current < maxRetries) {
            authCheckAttempt.current++;
            setTimeout(checkAuth, 1000);
            return;
          }
          setIsAuthenticated(false);
          setAuthCheckFailed(true);
        }
      } finally {
        if (isMounted.current) {
          setIsCheckingAuth(false);
        }
      }
    };
    
    // Set timeout for auth check
    timeoutId = setTimeout(() => {
      if (isMounted.current && isCheckingAuth) {
        console.log("ProtectedRoute: Auth check timeout reached");
        setIsCheckingAuth(false);
        setAuthCheckFailed(true);
      }
    }, 8000);
    
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`ProtectedRoute: Auth state change event: ${event}`);
      
      if (event === 'SIGNED_IN' && isMounted.current) {
        console.log("ProtectedRoute: Received SIGNED_IN event with session");
        checkAuth();
      } else if (event === 'SIGNED_OUT' && isMounted.current) {
        console.log("ProtectedRoute: Received SIGNED_OUT event");
        setIsAuthenticated(false);
      }
    });
    
    // Start the initial check
    checkAuth();
    
    return () => {
      console.log("ProtectedRoute: Cleanup");
      isMounted.current = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);
  
  // Handle clean logout for user recovery option
  const handleCleanLogin = async () => {
    try {
      await forceSignOut();
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 300);
    } catch (error) {
      console.error("Error during clean logout:", error);
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
          setIsRetrying(true);
          
          setTimeout(async () => {
            const isAuthValid = await verifyAuth();
            setIsAuthenticated(isAuthValid);
            setIsCheckingAuth(false);
            setIsRetrying(false);
            if (!isAuthValid) {
              setAuthCheckFailed(true);
            }
          }, 1000);
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
    // Only show toast when coming from a protected route
    if (location.pathname !== '/' && location.pathname !== '/login') {
      toast({
        title: "Accès refusé",
        description: "Vous devez être connecté pour accéder à cette page.",
        variant: "destructive"
      });
    }
    
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  // If authenticated, show protected content
  return <>{children}</>;
};

export default ProtectedRoute;
