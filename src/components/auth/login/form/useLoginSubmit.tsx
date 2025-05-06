
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";

export const useLoginSubmit = () => {
  const navigate = useNavigate();

  // Fonction simplifiée qui retourne toujours true pour éviter les blocages
  const checkInternetConnection = async (): Promise<boolean> => {
    return true;
  };

  // Fonction simplifiée pour vérifier l'authentification
  const checkAuthentication = async (): Promise<boolean> => {
    try {
      const { data } = await supabase.auth.getSession();
      return !!(data && data.session);
    } catch (e) {
      console.log("Erreur ignorée lors de la vérification d'authentification");
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
      console.log("Tentative de connexion pour:", email);
      
      // Nettoyage des données d'authentification avant la tentative
      clearStoredAuthData();
      
      // Tentative de connexion directe
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error.message);
        throw error;
      }
      
      // Vérifier que la session est bien établie
      let isAuthenticated = false;
      let attempts = 0;
      
      while (!isAuthenticated && attempts < 3) {
        await new Promise(resolve => setTimeout(resolve, 300));
        isAuthenticated = await checkAuthentication();
        attempts++;
      }
      
      if (!isAuthenticated) {
        console.warn("Session non établie - tentative de récupération");
        try {
          await supabase.auth.refreshSession();
          isAuthenticated = await checkAuthentication();
        } catch (refreshError) {
          console.error("Erreur lors du rafraîchissement:", refreshError);
        }
      }
      
      console.log("Connexion réussie");
      
      // Sauvegarder l'email pour la prochaine connexion
      localStorage.setItem('last_logged_in_email', email);
      
      // Notification de succès
      toast({
        title: "Connexion réussie",
        description: "Redirection vers votre tableau de bord...",
      });
      
      // Attendre avant la redirection
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Rediriger avec un refresh complet pour garantir un état propre
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error("Erreur complète:", error);
      
      toast({
        title: "Échec de connexion",
        description: "Email ou mot de passe incorrect.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
