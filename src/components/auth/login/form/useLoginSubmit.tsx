
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase';

export const useLoginSubmit = () => {
  const navigate = useNavigate();
  const supabase = createClient();

  // Version améliorée de la fonction de connexion
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
      
      // Nettoyage des données d'authentification obsolètes
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-auth-token');
      
      // Délai court pour s'assurer que le nettoyage est terminé
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Tentative de connexion avec options simplifiées
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
