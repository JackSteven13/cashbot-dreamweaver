
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { createClient, clearAuthData } from '@/lib/supabase';

export const useLoginSubmit = () => {
  const navigate = useNavigate();
  const supabase = createClient();

  // Version robuste et fiable de la fonction de connexion
  const handleSubmit = async (
    e: React.FormEvent,
    email: string,
    password: string,
    setIsLoading: (isLoading: boolean) => void
  ) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log("Préparation de la connexion pour:", email);
      
      // Nettoyage complet des données d'authentification avant la tentative
      clearAuthData();
      
      // Court délai pour s'assurer que le nettoyage est pris en compte
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log("Tentative de connexion pour:", email);
      
      // Tentative de connexion avec nouvelle instance
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error.message);
        throw error;
      }

      if (!data.session) {
        throw new Error("Échec d'authentification - Pas de session retournée");
      }
      
      console.log("Connexion réussie");
      
      // Sauvegarder l'email pour la prochaine connexion
      localStorage.setItem('last_logged_in_email', email);
      
      // Notification de succès
      toast({
        title: "Connexion réussie",
        description: "Redirection vers votre tableau de bord...",
      });
      
      // Redirection complète avec rafraîchissement de page pour éviter les problèmes d'état
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error("Erreur complète:", error);
      
      // Message d'erreur adapté
      toast({
        title: "Échec de connexion",
        description: "Email ou mot de passe incorrect.",
        variant: "destructive"
      });
      
      // Nettoyage après échec
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
