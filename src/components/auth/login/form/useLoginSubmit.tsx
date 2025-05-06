
import * as React from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthData } from '@/lib/supabase';

export const useLoginSubmit = () => {
  // Version robuste de la fonction de connexion
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
      clearAuthData();
      
      // Suppression explicite des jetons potentiellement obsolètes qui pourraient causer des conflits
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.log("Erreur lors de la déconnexion préalable ignorée");
      }
      
      // Court délai pour assurer que le nettoyage est effectif
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log("Tentative de connexion pour:", email);
      
      // Tentative de connexion avec des options optimisées pour la fiabilité
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error.message);
        throw error;
      }

      if (!data.session) {
        console.error("Pas de session retournée");
        throw new Error("Pas de session retournée");
      }
      
      console.log("Connexion réussie, session active");
      
      // Sauvegarder l'email pour la prochaine connexion
      localStorage.setItem('last_logged_in_email', email);
      
      // Notification de succès
      toast({
        title: "Connexion réussie",
        description: "Redirection vers votre tableau de bord...",
      });
      
      // Redirection complète avec rafraîchissement - délai augmenté pour assurer la propagation
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1200);
      
    } catch (error: any) {
      console.error("Erreur d'authentification complète:", error);
      
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
