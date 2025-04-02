
import { useCallback } from 'react';
import { verifyAuth } from "@/utils/auth/index";
import { refreshSession } from "@/utils/auth/index";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

interface UseAuthCheckParams {
  mountedRef: React.RefObject<boolean>;
}

export const useAuthCheck = ({ mountedRef }: UseAuthCheckParams) => {
  const navigate = useNavigate();
  
  // Fonction améliorée de vérification d'authentification avec meilleure gestion des erreurs
  const checkAuth = useCallback(async () => {
    try {
      console.log("Initialisation du dashboard: vérification de l'état d'authentification");
      
      // Éviter les vérifications pendant les redirections
      const isRedirecting = localStorage.getItem('auth_redirecting') === 'true';
      const redirectTimestamp = parseInt(localStorage.getItem('auth_redirect_timestamp') || '0');
      const now = Date.now();
      const isRedirectStale = now - redirectTimestamp > 10000; // 10 secondes
      
      // Si une redirection est en cours et n'est pas obsolète, sauter la vérification
      if (isRedirecting && !isRedirectStale) {
        console.log("Redirection déjà en cours, vérification d'authentification ignorée");
        return false;
      } else if (isRedirecting && isRedirectStale) {
        // Nettoyer les flags de redirection obsolètes
        localStorage.removeItem('auth_redirecting');
        localStorage.removeItem('auth_redirect_timestamp');
      }
      
      // Vérifier d'abord si une session est présente localement
      const localSession = localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      if (!localSession) {
        console.log("Aucune session locale trouvée, redirection vers login");
        
        if (mountedRef.current) {
          // Définir un flag pour éviter les redirections multiples
          localStorage.setItem('auth_redirecting', 'true');
          localStorage.setItem('auth_redirect_timestamp', Date.now().toString());
          
          // Rediriger après un court délai
          setTimeout(() => {
            if (mountedRef.current) {
              navigate('/login', { replace: true });
              
              // Nettoyer le flag après la redirection
              setTimeout(() => {
                localStorage.removeItem('auth_redirecting');
                localStorage.removeItem('auth_redirect_timestamp');
              }, 800);
            }
          }, 500);
        }
        
        return false;
      }
      
      // Éviter le rafraîchissement pendant les redirections
      if (isRedirecting) {
        console.log("Redirection en cours, rafraîchissement de session ignoré");
      } else {
        // Tenter de rafraîchir la session pour plus de résilience
        try {
          // Vérifier si un rafraîchissement est déjà en cours
          const isRefreshing = localStorage.getItem('auth_refreshing') === 'true';
          if (isRefreshing) {
            console.log("Rafraîchissement de session déjà en cours, attente");
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            localStorage.setItem('auth_refreshing', 'true');
            try {
              console.log("Tentative de rafraîchissement de la session");
              await refreshSession();
            } catch (refreshError) {
              console.error("Échec du rafraîchissement de la session:", refreshError);
              // Continuer avec la vérification même si le rafraîchissement échoue
            } finally {
              localStorage.removeItem('auth_refreshing');
            }
            
            // Petit délai pour permettre la propagation du rafraîchissement
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        } catch (error) {
          console.error("Erreur générale lors du rafraîchissement:", error);
          localStorage.removeItem('auth_refreshing');
        }
      }
      
      if (!mountedRef.current) return false;
      
      // Vérifier l'authentification avec gestion des erreurs améliorée
      let isAuthenticated = false;
      try {
        console.log("Vérification du statut d'authentification");
        isAuthenticated = await verifyAuth();
        console.log("Résultat de la vérification d'authentification:", isAuthenticated);
      } catch (verifyError) {
        console.error("Erreur lors de la vérification d'authentification:", verifyError);
        // En cas d'erreur, considérer l'utilisateur comme non authentifié
        isAuthenticated = false;
      }
      
      if (!mountedRef.current) return false;
      
      if (!isAuthenticated) {
        console.log("Aucune session active trouvée, redirection vers login");
        
        // Forcer la suppression des jetons d'authentification pour garantir un état propre
        try {
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
        } catch (e) {
          console.error("Erreur lors de la suppression des jetons:", e);
        }
        
        // Afficher un toast pour un meilleur retour utilisateur
        if (mountedRef.current) {
          toast({
            title: "Session expirée",
            description: "Votre session a expiré. Veuillez vous reconnecter.",
            variant: "destructive"
          });
          
          // Définir un flag pour éviter les redirections multiples
          localStorage.setItem('auth_redirecting', 'true');
          localStorage.setItem('auth_redirect_timestamp', Date.now().toString());
          
          setTimeout(() => {
            if (mountedRef.current) {
              navigate('/login', { replace: true });
              
              // Nettoyer le flag après la redirection
              setTimeout(() => {
                localStorage.removeItem('auth_redirecting');
                localStorage.removeItem('auth_redirect_timestamp');
              }, 800);
            }
          }, 500);
        }
        
        return false;
      }
      
      console.log("Session active trouvée, poursuite de l'initialisation du dashboard");
      return true;
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      localStorage.removeItem('auth_refreshing');
      
      if (mountedRef.current) {
        toast({
          title: "Erreur d'authentification",
          description: "Un problème est survenu. Veuillez réessayer.",
          variant: "destructive"
        });
      }
      
      return false;
    }
  }, [mountedRef, navigate]);

  return { checkAuth };
};
