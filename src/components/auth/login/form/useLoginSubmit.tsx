
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
      console.log("Nettoyage préventif des données d'authentification...");
      clearStoredAuthData();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log("Tentative de connexion avec email:", email);
      
      // Version simplifiée de l'authentification sans options complexes
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      
      if (error) {
        console.error("Erreur d'authentification Supabase:", error);
        throw new Error(error.message || "Erreur de connexion");
      }
      
      if (!data || !data.user) {
        console.error("Données d'authentification incomplètes");
        throw new Error("Données d'authentification incomplètes");
      }
      
      console.log("Connexion réussie pour:", data.user.email);
      
      // Enregistrer l'email pour la prochaine connexion
      localStorage.setItem('last_logged_in_email', email);
      
      // Toast de réussite
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${data.user.user_metadata?.full_name || ''}!`,
      });
      
      // Délai court pour laisser le toast s'afficher
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirection vers le tableau de bord avec remplacement de l'historique
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error("Erreur complète:", error);
      
      // Message d'erreur par défaut
      let errorMessage = "Email ou mot de passe incorrect.";
      
      // Notification d'erreur
      toast({
        title: "Échec de connexion",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
