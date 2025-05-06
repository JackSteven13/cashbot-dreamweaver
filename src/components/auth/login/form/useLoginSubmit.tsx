
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, forceRetrySigning } from "@/integrations/supabase/client";

export const useLoginSubmit = () => {
  const navigate = useNavigate();

  // Fonction améliorée pour vérifier si la connexion internet est disponible
  const checkInternetConnection = async (): Promise<boolean> => {
    // Vérification basique de la connexion
    if (!navigator.onLine) {
      return false;
    }
    
    try {
      // Utiliser une URL directe pour tester la connectivité
      const supabaseApiUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://cfjibduhagxiwqkiyhqd.supabase.co'}/auth/v1/`;
      
      // Essayer d'accéder à Supabase avec un timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes timeout
      
      const response = await fetch(supabaseApiUrl, { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (e) {
      console.error("Erreur lors de la vérification de connectivité:", e);
      // Si l'erreur est un timeout ou un problème réseau, considérer qu'il n'y a pas de connexion
      return false;
    }
  };

  // Fonction simplifiée pour vérifier l'authentification
  const checkAuthentication = async (): Promise<boolean> => {
    try {
      const { data } = await supabase.auth.getSession();
      return !!(data && data.session);
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    email: string,
    password: string,
    setIsLoading: (isLoading: boolean) => void
  ) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Vérifier la connexion internet d'abord avec une notification visuelle
      console.log("Vérification de la connexion internet...");
      const isOnline = await checkInternetConnection();
      
      if (!isOnline) {
        toast({
          title: "Erreur de connexion",
          description: "Impossible de communiquer avec le serveur d'authentification. Veuillez vérifier votre connexion internet et réessayer.",
          variant: "destructive",
          duration: 6000
        });
        setIsLoading(false);
        return;
      }
      
      console.log("Connexion internet vérifiée. Tentative de connexion pour:", email);
      
      // Nettoyage plus agressif avant la tentative de connexion
      await forceRetrySigning();
      
      // Créer des promises pour la tentative de connexion et le timeout
      const loginPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      // Promise de timeout plus longue (20 secondes)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Délai d'attente dépassé - le serveur met trop de temps à répondre")), 20000);
      });
      
      // Course entre la connexion et le timeout
      const { data, error } = await Promise.race([
        loginPromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        console.error("Erreur d'authentification détaillée:", error);
        
        // Gestion améliorée des erreurs réseau
        if (error.message && (
            error.message.includes('network') || 
            error.message.includes('fetch') || 
            error.message.includes('Failed') ||
            error.message.includes('timeout') ||
            error.message.includes('abort') ||
            error.message.includes('connect')
          )) {
          
          toast({
            title: "Problème de connexion",
            description: "Impossible de communiquer avec le serveur d'authentification. Veuillez vérifier votre connexion internet et réessayer dans quelques instants.",
            variant: "destructive",
            duration: 7000
          });
          setIsLoading(false);
          return;
        }
        
        // Si c'est une erreur d'authentification normale (identifiants incorrects)
        throw error;
      }
      
      // Vérifier que la session est bien établie, avec un timeout plus court
      let authCheckPromise = checkAuthentication();
      const authCheckTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout lors de la vérification de session")), 5000);
      });
      
      const isAuthenticated = await Promise.race([authCheckPromise, authCheckTimeout])
        .catch(err => {
          console.error("Erreur lors de la vérification de session:", err);
          return false;
        });
      
      if (!isAuthenticated) {
        console.warn("Session non établie après connexion apparemment réussie");
        
        // Tentative de récupération avec timeout
        try {
          const refreshPromise = supabase.auth.refreshSession();
          const refreshTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout lors du rafraîchissement de session")), 5000);
          });
          
          await Promise.race([refreshPromise, refreshTimeout]);
          const secondCheck = await checkAuthentication();
          
          if (!secondCheck) {
            throw new Error("Échec de synchronisation de session");
          }
        } catch (refreshError) {
          console.error("Erreur lors du rafraîchissement de la session:", refreshError);
          
          toast({
            title: "Problème de synchronisation",
            description: "Votre connexion a été acceptée mais la session n'a pas pu être établie. Veuillez réessayer.",
            variant: "destructive",
            duration: 5000
          });
          setIsLoading(false);
          return;
        }
      }
      
      console.log("Connexion réussie, session établie");
      
      // Sauvegarder l'email pour la prochaine connexion
      localStorage.setItem('last_logged_in_email', email);
      
      // Notification de succès
      toast({
        title: "Connexion réussie",
        description: "Redirection vers votre tableau de bord...",
        duration: 3000
      });
      
      // Attendre avant la redirection
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Force reload pour garantir un état propre
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error("Erreur complète:", error);
      
      // Message d'erreur adapté
      if (error.message?.includes('timeout') || error.message?.includes('Délai')) {
        toast({
          title: "Délai d'attente dépassé",
          description: "Le serveur met trop de temps à répondre. Veuillez vérifier votre connexion et réessayer.",
          variant: "destructive",
          duration: 5000
        });
      } else if (error.status === 429) {
        toast({
          title: "Trop de tentatives",
          description: "Veuillez attendre un moment avant de réessayer.",
          variant: "destructive",
          duration: 5000
        });
      } else if (error.message?.includes('credentials') || error.message?.includes('user')) {
        toast({
          title: "Échec de connexion",
          description: "Email ou mot de passe incorrect.",
          variant: "destructive",
          duration: 5000
        });
      } else {
        toast({
          title: "Erreur de connexion",
          description: "Une erreur est survenue. Veuillez réessayer plus tard.",
          variant: "destructive",
          duration: 5000
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
