
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';

interface UseAuthStateListenerParams {
  mountedRef: React.RefObject<boolean>;
  navigate: ReturnType<typeof useNavigate>;
}

export const useAuthStateListener = ({ mountedRef, navigate }: UseAuthStateListenerParams) => {
  const setupAuthListener = useCallback(() => {
    console.log("Configuration de l'écouteur d'état d'authentification pour le dashboard");
    
    // Référence pour éviter les redirections multiples
    const redirectingRef = { current: false };
    
    // Variable pour stocker la fonction de nettoyage de l'abonnement
    let cleanupFunction: (() => void) | null = null;
    
    try {
      // Nettoyer tout abonnement existant pour éviter les doublons
      // Utiliser unsubscribe au lieu de undefined pour éviter les erreurs
      try {
        const { data } = supabase.auth.onAuthStateChange(() => {});
        if (data && data.subscription && data.subscription.unsubscribe) {
          data.subscription.unsubscribe();
        }
      } catch (e) {
        console.error("Erreur lors du nettoyage de l'écouteur:", e);
      }
      
      // Configuration de l'écouteur d'état d'authentification avec résilience améliorée
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mountedRef.current) return;
        
        console.log(`Changement d'état d'authentification: ${event}`);
        
        if (event === 'SIGNED_OUT' && !redirectingRef.current) {
          console.log("Utilisateur déconnecté, redirection vers login");
          redirectingRef.current = true;
          
          // Enregistrer un flag dans localStorage pour indiquer qu'une redirection est en cours
          try {
            localStorage.setItem('auth_redirecting', 'true');
            localStorage.setItem('auth_redirect_timestamp', Date.now().toString());
          } catch (e) {
            console.error("Erreur lors de la définition du flag de redirection:", e);
          }
          
          // Utiliser un délai pour éviter la navigation immédiate
          const timeoutId = setTimeout(() => {
            if (mountedRef.current) {
              navigate('/login', { replace: true });
              
              // Une fois la redirection terminée, réinitialiser le flag
              setTimeout(() => {
                try {
                  localStorage.removeItem('auth_redirecting');
                  localStorage.removeItem('auth_redirect_timestamp');
                  redirectingRef.current = false;
                } catch (e) {
                  console.error("Erreur lors de la réinitialisation du flag de redirection:", e);
                }
              }, 800);
            }
          }, 500);
          
          // Stocker la fonction de nettoyage pour le timeout
          const originalCleanup = cleanupFunction;
          cleanupFunction = () => {
            clearTimeout(timeoutId);
            if (originalCleanup) originalCleanup();
          };
        } else if (event === 'TOKEN_REFRESHED') {
          console.log("Jeton rafraîchi avec succès");
        }
      });
      
      // Définir la fonction de nettoyage pour l'abonnement
      const originalCleanup = cleanupFunction;
      cleanupFunction = () => {
        console.log("Nettoyage de l'écouteur d'état d'authentification");
        subscription.unsubscribe();
        if (originalCleanup) originalCleanup();
      };
      
      // Retourner la fonction de nettoyage
      return () => {
        if (cleanupFunction) cleanupFunction();
      };
    } catch (error) {
      console.error("Erreur lors de la configuration de l'écouteur d'authentification:", error);
      
      // En cas d'erreur, toujours retourner une fonction de nettoyage
      return () => {
        if (cleanupFunction) cleanupFunction();
      };
    }
  }, [mountedRef, navigate]);
  
  return { setupAuthListener };
};
