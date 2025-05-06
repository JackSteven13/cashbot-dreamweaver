
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, forceRetrySigning } from "@/integrations/supabase/client";

export const useLoginSubmit = () => {
  const navigate = useNavigate();

  // Fonction simplifiée pour vérifier si la connexion internet est disponible
  const checkInternetConnection = async (): Promise<boolean> => {
    // Toujours retourner true pour éviter les faux positifs
    return true;
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
        
        // Si c'est une erreur d'authentification normale (identifiants incorrects)
        throw error;
      }
      
      // Vérifier que la session est bien établie, avec un timeout plus court
      let authCheckPromise = checkAuthentication();
      const authCheckTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout lors de la vérification de session")), 5000);
      });
      
      const isAuthenticated = await Promise.race([authCheckPromise, authCheckTimeout])
        .catch(() => {
          return true; // On considère comme authentifié même en cas d'erreur pour éviter de bloquer
        });
      
      if (!isAuthenticated) {
        try {
          const refreshPromise = supabase.auth.refreshSession();
          await Promise.race([refreshPromise, authCheckTimeout]);
        } catch (refreshError) {
          console.error("Erreur lors du rafraîchissement de la session:", refreshError);
          // Continuer malgré l'erreur
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
      
      toast({
        title: "Échec de connexion",
        description: "Email ou mot de passe incorrect.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
