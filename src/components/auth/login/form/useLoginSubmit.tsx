
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
      console.log("Tentative de connexion pour:", email);
      
      // Nettoyer les données d'authentification existantes
      clearStoredAuthData();
      
      // Attendre pour que le nettoyage soit effectué
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Tentative de connexion directe sans options supplémentaires
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error.message);
        throw error;
      }
      
      if (data?.user) {
        console.log("Connexion réussie pour l'utilisateur:", data.user.id);
        
        // Enregistrer l'email pour une reconnexion ultérieure
        localStorage.setItem('last_logged_in_email', email);
        
        // Afficher un toast de confirmation
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté.",
        });
        
        // Redirection vers le tableau de bord
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error("Échec de connexion: aucune donnée utilisateur retournée");
      }
    } catch (error: any) {
      console.error("Erreur lors de la tentative de connexion:", error);
      
      // Message d'erreur utilisateur
      toast({
        title: "Erreur de connexion",
        description: "Email ou mot de passe incorrect. Veuillez réessayer.",
        variant: "destructive"
      });
      
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
