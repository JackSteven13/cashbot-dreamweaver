
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

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
      console.log("Tentative de connexion directe pour:", email);
      
      // Authentification simple et directe
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error);
        throw error;
      }
      
      if (data?.user) {
        // Stocker l'email pour faciliter les connexions futures
        localStorage.setItem('last_logged_in_email', email);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${data.user.user_metadata?.full_name || email.split('@')[0] || 'utilisateur'}!`,
        });
        
        // Redirection immédiate vers le tableau de bord
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error("Échec de connexion: aucune donnée utilisateur retournée");
      }
    } catch (error: any) {
      console.error("Erreur détaillée de connexion:", error);
      
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
