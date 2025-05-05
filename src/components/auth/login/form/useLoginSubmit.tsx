
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
      console.log("=== DÉBUT DE LA PROCÉDURE DE CONNEXION ===");
      console.log("Email utilisé:", email);
      
      // Nettoyage radical avant toute tentative
      clearStoredAuthData();
      
      // Attendre pour s'assurer que le nettoyage est effectif
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("Tentative de connexion directe...");
      
      // Utiliser une version simplifiée et directe de l'API d'authentification
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error.message);
        throw new Error(error.message);
      }
      
      if (!data?.user || !data?.session) {
        console.error("Réponse d'authentification incomplète:", data);
        throw new Error("La réponse du serveur d'authentification est incomplète");
      }
      
      // La connexion a réussi
      console.log("Connexion réussie!", data.user);
      localStorage.setItem('last_logged_in_email', email);
      
      // Afficher un toast de confirmation
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté.",
      });
      
      // Redirection vers le tableau de bord après un court délai
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 300);
      
    } catch (error: any) {
      console.error("Erreur complète lors de la connexion:", error);
      
      // Message d'erreur utilisateur détaillé mais simplifié
      let errorMessage = "Une erreur s'est produite lors de la connexion.";
      
      if (error.message) {
        if (error.message.includes("Failed to fetch") || error.message.includes("fetch")) {
          errorMessage = "Impossible de communiquer avec le serveur d'authentification. Veuillez vérifier votre connexion internet.";
        } else if (error.message.includes("Invalid login") || error.message.includes("incorrect")) {
          errorMessage = "Email ou mot de passe incorrect. Veuillez réessayer.";
        } else {
          errorMessage = `Erreur: ${error.message}`;
        }
      }
      
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Nettoyer à nouveau en cas d'échec
      clearStoredAuthData();
    } finally {
      console.log("=== FIN DE LA PROCÉDURE DE CONNEXION ===");
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
