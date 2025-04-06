
import { FC, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Utiliser les importations spécifiques pour éviter les conflits
import { verifyAuth, refreshSession } from "@/utils/auth/index";
import { toast } from "@/components/ui/use-toast";

interface DashboardAuthCheckerProps {
  setIsAuthChecking: (value: boolean) => void;
  setAuthError: (value: boolean) => void;
}

const DashboardAuthChecker: FC<DashboardAuthCheckerProps> = ({ 
  setIsAuthChecking,
  setAuthError
}) => {
  const navigate = useNavigate();
  const authCheckInProgress = useRef(false);
  const maxAttempts = useRef(0);
  const checkTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Nettoyer les drapeaux potentiellement bloquants au montage
  useEffect(() => {
    const checkAndCleanBlockingFlags = () => {
      const now = Date.now();
      const redirectTimestamp = localStorage.getItem('auth_redirect_timestamp');
      
      // Si un flag de redirection est présent mais trop ancien (> 30s), le nettoyer
      if (localStorage.getItem('auth_redirecting') === 'true' && 
          redirectTimestamp && 
          now - parseInt(redirectTimestamp) > 30000) {
        console.log("Nettoyage des flags de redirection obsolètes");
        localStorage.removeItem('auth_redirecting');
        localStorage.removeItem('auth_redirect_timestamp');
      }
      
      // Nettoyer les flags de vérification bloqués
      if (localStorage.getItem('auth_checking') === 'true') {
        const checkTimestamp = localStorage.getItem('auth_check_timestamp');
        if (!checkTimestamp || now - parseInt(checkTimestamp) > 10000) {
          console.log("Nettoyage du flag de vérification bloqué");
          localStorage.removeItem('auth_checking');
          localStorage.removeItem('auth_check_timestamp');
        }
      }
    };
    
    // Exécuter immédiatement et programmer une vérification dans 2 secondes
    checkAndCleanBlockingFlags();
    const cleanupTimeout = setTimeout(checkAndCleanBlockingFlags, 2000);
    
    return () => clearTimeout(cleanupTimeout);
  }, []);
  
  const checkAuth = useCallback(async () => {
    if (authCheckInProgress.current) {
      console.log("Auth check already in progress, skipping");
      return false;
    }
    
    try {
      authCheckInProgress.current = true;
      
      // Marquer le début de la vérification
      localStorage.setItem('auth_checking', 'true');
      localStorage.setItem('auth_check_timestamp', Date.now().toString());
      
      // Essayer de rafraîchir la session avant tout
      await refreshSession();
      
      // Petit délai pour permettre au rafraîchissement de se propager
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const isAuthenticated = await verifyAuth();
      
      // Nettoyer le flag de vérification
      localStorage.removeItem('auth_checking');
      localStorage.removeItem('auth_check_timestamp');
      authCheckInProgress.current = false;
      
      if (!isAuthenticated) {
        console.log("No active session found, redirecting to login");
        setAuthError(true);
        
        // Forcer la suppression de tous les tokens et flags
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
        localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
        localStorage.removeItem('auth_checking');
        localStorage.removeItem('auth_refreshing');
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 400);
        return false;
      }
      
      console.log("Active session found, initializing dashboard");
      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError(true);
      
      // Nettoyer le flag de vérification en cas d'erreur
      localStorage.removeItem('auth_checking');
      localStorage.removeItem('auth_check_timestamp');
      authCheckInProgress.current = false;
      
      // Si trop de tentatives, forcer une redirection de nettoyage
      maxAttempts.current++;
      if (maxAttempts.current >= 3) {
        toast({
          title: "Erreur d'authentification",
          description: "Veuillez vous reconnecter pour résoudre le problème.",
          variant: "destructive"
        });
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
      
      return false;
    }
  }, [navigate, setAuthError]);

  // Configurer un timeout de sécurité pour débloquer la vérification
  useEffect(() => {
    checkTimeout.current = setTimeout(() => {
      if (authCheckInProgress.current) {
        console.log("Auth check timeout reached, resetting");
        localStorage.removeItem('auth_checking');
        localStorage.removeItem('auth_check_timestamp');
        authCheckInProgress.current = false;
        setIsAuthChecking(false);
        setAuthError(true);
      }
    }, 5000);
    
    return () => {
      if (checkTimeout.current) {
        clearTimeout(checkTimeout.current);
      }
    };
  }, [setIsAuthChecking, setAuthError]);

  // Effectuer la vérification immédiatement
  useEffect(() => {
    const doCheck = async () => {
      const result = await checkAuth();
      
      // Mettre à jour l'état de vérification
      setTimeout(() => {
        setIsAuthChecking(false);
      }, 500);
    };
    
    doCheck();
  }, [checkAuth, setIsAuthChecking]);

  return null; // This is a functional component with no UI
};

export default DashboardAuthChecker;
