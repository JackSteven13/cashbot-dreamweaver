
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";
import { getNetworkStatus, attemptNetworkRecovery } from '@/utils/auth/networkUtils';

export const useLoginSubmit = () => {
  const navigate = useNavigate();

  const handleSubmit = async (
    e: React.FormEvent,
    email: string,
    password: string,
    setIsLoading: (isLoading: boolean) => void
  ) => {
    e.preventDefault();
    
    if (setIsLoading) {
      setIsLoading(true);
    }
    
    // Nettoyer complètement les données d'authentification stockées
    clearStoredAuthData();
    
    try {
      // Vérifier la connexion réseau et la résolution DNS de manière plus robuste
      const networkStatus = await getNetworkStatus();
      
      if (!networkStatus.isOnline) {
        throw new Error("Vous semblez être hors ligne. Vérifiez votre connexion internet.");
      }
      
      if (!networkStatus.dnsWorking) {
        // Tentative de récupération réseau
        const recovered = await attemptNetworkRecovery();
        
        if (!recovered) {
          throw new Error("Problème de connexion au serveur Supabase. Vérifiez votre connexion ou réessayez plus tard.");
        }
      }
      
      // Configuration pour une authentification plus robuste, spécialement pour streamgenius.io
      const options = {
        email,
        password,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          captchaToken: null,
        }
      };
      
      // Variable pour suivre les tentatives
      let attemptCount = 0;
      let maxAttempts = 3;
      let authResult;
      let lastError = null;
      
      do {
        attemptCount++;
        console.log(`Tentative d'authentification ${attemptCount}/${maxAttempts}...`);
        
        try {
          // Configuration avancée pour la requête d'authentification
          const authPromise = supabase.auth.signInWithPassword(options);
          
          // Définir un timeout de 20 secondes (augmenté pour les connexions lentes)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Délai d'attente dépassé pour la connexion")), 20000);
          });
          
          // Utiliser race pour gérer le timeout
          authResult = await Promise.race([authPromise, timeoutPromise]);
          
          if (!authResult.error) break;
          lastError = authResult.error;
          
          // Attendre brièvement entre les tentatives avec délai exponentiel
          if (attemptCount < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(1.5, attemptCount)));
          }
        } catch (err) {
          console.error("Erreur lors de la tentative d'authentification:", err);
          lastError = err;
          
          // Attendre brièvement entre les tentatives avec délai exponentiel
          if (attemptCount < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(1.5, attemptCount)));
          }
        }
      } while (attemptCount < maxAttempts && (!authResult || authResult.error));
      
      // Si nous avons toujours une erreur après toutes les tentatives
      if (lastError || (authResult && authResult.error)) {
        throw lastError || authResult.error;
      }
      
      if (authResult?.data && authResult.data.user) {
        // Sauvegarder l'email pour les futures suggestions
        localStorage.setItem('last_logged_in_email', email);
        
        // Stocker l'origine du domaine pour aider à la compatibilité multi-domaines
        localStorage.setItem('auth_origin_domain', window.location.hostname);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${authResult.data.user.user_metadata?.full_name || authResult.data.user.email?.split('@')[0] || 'utilisateur'}!`,
        });
        
        // Mettre en place une double vérification de session avec temps limité
        const sessionCheckTimeout = setTimeout(() => {
          console.log("Expiration de la vérification de session, redirection forcée");
          navigate('/dashboard', { replace: true });
        }, 2000);
        
        try {
          // Vérifier que la session est bien établie avant de rediriger
          const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession();
          
          clearTimeout(sessionCheckTimeout);
          
          if (sessionError) {
            console.error("Erreur lors de la vérification de session:", sessionError);
            // Malgré l'erreur, continuer avec la redirection
            navigate('/dashboard', { replace: true });
            return;
          }
          
          if (sessionCheck && sessionCheck.session) {
            // Session confirmée, rediriger
            navigate('/dashboard', { replace: true });
          } else {
            // Session non confirmée, mais utilisateur authentifié
            console.log("Session non confirmée après connexion, mais utilisateur authentifié");
            navigate('/dashboard', { replace: true });
          }
        } catch (sessionError) {
          clearTimeout(sessionCheckTimeout);
          console.error("Erreur lors de la vérification de session:", sessionError);
          // Malgré l'erreur, continuer avec la redirection
          navigate('/dashboard', { replace: true });
        }
      } else {
        throw new Error("Échec de connexion: aucune donnée utilisateur retournée");
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      
      // Gestion plus robuste des erreurs réseau
      if (!navigator.onLine || 
          error.message?.includes('network') || 
          error.message?.includes('réseau') ||
          error.message?.includes('fetch') ||
          error.message?.includes('Failed to fetch') ||
          error.message?.includes("Délai d'attente dépassé")) {
        toast({
          title: "Problème de connexion réseau",
          description: "Impossible de joindre le serveur Supabase. Vérifiez votre connexion internet et réessayez.",
          variant: "destructive",
          action: <ToastAction altText="Réessayer" onClick={() => window.location.reload()}>
            Réessayer
          </ToastAction>
        });
      } else if (error.message === "Invalid login credentials" || error.message?.includes("credentials")) {
        toast({
          title: "Identifiants incorrects",
          description: "Email ou mot de passe incorrect",
          variant: "destructive",
          action: <ToastAction altText="Réessayer" onClick={() => null}>
            OK
          </ToastAction>
        });
      } else {
        toast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter. Veuillez réessayer.",
          variant: "destructive",
          action: <ToastAction altText="Réessayer" onClick={() => window.location.reload()}>
            Réessayer
          </ToastAction>
        });
      }
      
      if (setIsLoading) {
        setIsLoading(false);
      }
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
