
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, forceRetrySigning } from "@/integrations/supabase/client";

export const useLoginSubmit = () => {
  const navigate = useNavigate();

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
      console.log("Tentative de connexion pour:", email);
      
      // S'assurer qu'il n'y a pas de données d'authentification obsolètes
      await forceRetrySigning();
      
      // Tentative de connexion standard
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error.message);
        
        // Si l'erreur semble liée au réseau, tenter une approche alternative
        if (error.message.includes('network') || 
            error.message.includes('fetch') || 
            error.message.includes('Failed') ||
            error.message.includes('timeout')) {
          
          console.log("Problème de réseau détecté, nouvelle tentative");
          
          // Nettoyer et réessayer
          await forceRetrySigning();
          
          // Seconde tentative
          const secondAttempt = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          
          if (secondAttempt.error) {
            throw secondAttempt.error;
          }
        } else {
          throw error;
        }
      }
      
      // Vérifier que la session est bien établie
      await new Promise(resolve => setTimeout(resolve, 500));
      const isAuthenticated = await checkAuthentication();
      
      if (!isAuthenticated) {
        console.warn("Session non établie après connexion apparemment réussie");
        
        // Tentative de récupération
        await supabase.auth.refreshSession();
        
        const retryAuthentication = await checkAuthentication();
        if (!retryAuthentication) {
          console.error("Impossible de confirmer l'authentification");
          throw new Error("Session non établie après connexion");
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
      
      // Redirection
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error("Erreur complète:", error);
      
      // Message d'erreur adapté
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
