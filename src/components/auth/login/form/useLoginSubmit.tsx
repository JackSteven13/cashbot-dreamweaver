
import * as React from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { clearStoredAuthData } from '@/integrations/supabase/client';

export const useLoginSubmit = () => {
  // Version ultra simplifiée et robuste de la fonction de connexion
  const handleSubmit = async (
    e: React.FormEvent,
    email: string,
    password: string,
    setIsLoading: (isLoading: boolean) => void
  ) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Champs obligatoires",
        description: "Veuillez saisir votre email et votre mot de passe",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Préparation de la connexion");
      
      // Nettoyage complet avant la tentative
      clearStoredAuthData();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("Tentative de connexion pour:", email);
      
      // Tentative de connexion avec configuration simplifiée
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error("Pas de session retournée");
      }
      
      console.log("Connexion réussie");
      
      // Sauvegarder l'email pour la prochaine connexion
      localStorage.setItem('last_logged_in_email', email);
      
      // Notification de succès
      toast({
        title: "Connexion réussie",
        description: "Redirection vers votre tableau de bord...",
      });
      
      // Redirection complète avec rafraîchissement
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
      clearStoredAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
