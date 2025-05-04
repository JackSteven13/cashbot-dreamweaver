
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
      
      // Nettoyer les données d'authentification existantes AVANT de tenter la connexion
      clearStoredAuthData();
      
      // Attendre un court instant pour s'assurer que le nettoyage est effectif
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Effectuer une connexion simple
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      
      // Gérer les erreurs d'authentification
      if (error) {
        console.error("Erreur d'authentification:", error.message);
        throw new Error(`Erreur d'authentification: ${error.message}`);
      }
      
      // Vérifier la réponse
      if (!data?.user || !data?.session) {
        throw new Error("Échec de connexion: aucune donnée utilisateur retournée");
      }
      
      console.log("Connexion réussie pour l'utilisateur:", data.user.id);
      
      // Enregistrer l'email pour une reconnexion ultérieure
      localStorage.setItem('last_logged_in_email', email);
      
      // Afficher un toast de confirmation
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté.",
      });
      
      // Redirection vers le tableau de bord après un court délai
      // pour permettre à la session d'être correctement établie
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 300);
      
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
