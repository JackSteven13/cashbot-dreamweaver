
import { FC, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyAuth, refreshSession, forceSignOut } from "@/utils/auth/index";
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
  const executingCleanup = useRef(false);
  
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
    
    // Exécuter immédiatement
    checkAndCleanBlockingFlags();
    
    // Nettoyage périodique pour éviter les états bloqués
    const cleanupInterval = setInterval(checkAndCleanBlockingFlags, 10000);
    
    return () => clearInterval(cleanupInterval);
  }, []);
  
  // Fonction de nettoyage radical en cas de problème persistant
  const performEmergencyCleanup = useCallback(async () => {
    if (executingCleanup.current) return;
    
    executingCleanup.current = true;
    console.log("Exécution du nettoyage d'urgence des sessions");
    
    try {
      // Force la déconnexion complète
      await forceSignOut();
      
      // Nettoyage complet du localStorage
      localStorage.clear();
      
      // Notification à l'utilisateur
      toast({
        title: "Session réinitialisée",
        description: "Veuillez vous reconnecter",
        variant: "destructive"
      });
      
      // Redirection après un court délai
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } catch (e) {
      console.error("Erreur lors du nettoyage d'urgence:", e);
      // En cas d'échec, redirection forcée
      window.location.href = '/login';
    } finally {
      executingCleanup.current = false;
    }
  }, []);
  
  const checkAuth = useCallback(async () => {
    if (authCheckInProgress.current) {
      console.log("Auth check already in progress, skipping");
      return false;
    }
    
    try {
      authCheckInProgress.current = true;
      
      // Marquer le début de la vérification avec timestamp
      localStorage.setItem('auth_checking', 'true');
      localStorage.setItem('auth_check_timestamp', Date.now().toString());
      
      // Protection contre les vérifications bloquées
      checkTimeout.current = setTimeout(() => {
        console.log("Auth check timeout reached");
        authCheckInProgress.current = false;
        localStorage.removeItem('auth_checking');
        localStorage.removeItem('auth_check_timestamp');
        setAuthError(true);
        
        // Si trop de timeouts consécutifs, lancer le nettoyage d'urgence
        maxAttempts.current++;
        if (maxAttempts.current >= 3) {
          performEmergencyCleanup();
        }
      }, 8000);
      
      // Essayer de rafraîchir la session avant tout
      await refreshSession();
      
      // Petit délai pour permettre au rafraîchissement de se propager
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const isAuthenticated = await verifyAuth();
      
      // Nettoyer le timeout et le flag de vérification
      if (checkTimeout.current) {
        clearTimeout(checkTimeout.current);
        checkTimeout.current = null;
      }
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
      if (checkTimeout.current) {
        clearTimeout(checkTimeout.current);
        checkTimeout.current = null;
      }
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
          performEmergencyCleanup();
        }, 1500);
      }
      
      return false;
    }
  }, [navigate, setAuthError, performEmergencyCleanup]);

  // Configurer un timeout de sécurité pour débloquer la vérification
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (authCheckInProgress.current) {
        console.log("Auth check safety timeout reached, resetting");
        localStorage.removeItem('auth_checking');
        localStorage.removeItem('auth_check_timestamp');
        authCheckInProgress.current = false;
        setIsAuthChecking(false);
        setAuthError(true);
      }
    }, 10000); // 10 secondes max pour la vérification totale
    
    return () => {
      clearTimeout(safetyTimeout);
      if (checkTimeout.current) {
        clearTimeout(checkTimeout.current);
      }
    };
  }, [setIsAuthChecking, setAuthError]);

  // Effectuer la vérification immédiatement puis périodiquement
  useEffect(() => {
    const doCheck = async () => {
      const result = await checkAuth();
      
      // Mettre à jour l'état de vérification avec délai
      setTimeout(() => {
        setIsAuthChecking(false);
      }, 500);
      
      // Vérification périodique si réussite
      if (result) {
        const interval = setInterval(async () => {
          if (!authCheckInProgress.current) {
            await checkAuth();
          }
        }, 60000); // Vérifier toutes les minutes
        
        return () => clearInterval(interval);
      }
    };
    
    doCheck();
  }, [checkAuth, setIsAuthChecking]);

  return null; // This is a functional component with no UI
};

export default DashboardAuthChecker;
