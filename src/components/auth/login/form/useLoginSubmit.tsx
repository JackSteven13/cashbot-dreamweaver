
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";

export const useLoginSubmit = () => {
  const navigate = useNavigate();

  const handleSubmit = async (
    e: React.FormEvent,
    email: string,
    password: string,
    setIsLoading: (isLoading: boolean) => void
  ) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log("=== DÉBUT PROCÉDURE DE CONNEXION - MÉTHODE DIRECTE ===");
      
      // 1. Nettoyage RADICAL avant tout
      console.log("Étape 1: Nettoyage radical des données d'authentification");
      clearStoredAuthData();
      
      // 2. Tentative de connexion immédiate et directe
      console.log("Étape 2: Tentative de connexion directe simplifiée");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (error) throw error;
      
      if (!data || !data.user || !data.session) {
        throw new Error("La réponse d'authentification est incomplète");
      }
      
      // 3. Stockage de l'email pour la prochaine connexion
      console.log("Étape 3: Sauvegarde de l'email et finalisation");
      localStorage.setItem('last_logged_in_email', email);
      
      // 4. Toast et redirection
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté.",
      });
      
      // Redirection vers le tableau de bord
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 300);
      
    } catch (error: any) {
      console.error("ERREUR DE CONNEXION:", error);
      
      // Message d'erreur simplifié
      let errorMessage = "Impossible de se connecter.";
      
      if (error.message) {
        if (error.message.includes("Failed to fetch") || 
            error.message.includes("fetch") ||
            error.message.includes("network") ||
            error.message.includes("AbortError")) {
          errorMessage = "Erreur de communication avec le serveur d'authentification. Vérifiez votre connexion internet et réessayez.";
        } else if (error.message.includes("Invalid login") || 
                  error.message.includes("incorrect") ||
                  error.message.includes("wrong") ||
                  error.message.includes("Email") ||
                  error.message.includes("password")) {
          errorMessage = "Email ou mot de passe incorrect. Veuillez réessayer.";
        } else {
          errorMessage = `Erreur: ${error.message}`;
        }
      }
      
      toast({
        title: "Échec de connexion",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Nettoyage après échec
      clearStoredAuthData();
    } finally {
      console.log("=== FIN PROCÉDURE DE CONNEXION ===");
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
