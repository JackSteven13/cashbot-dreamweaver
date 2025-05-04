
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
      // Nettoyer complètement toutes les données d'authentification existantes
      clearStoredAuthData();
      
      // Attendre un moment pour s'assurer que le nettoyage est terminé
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Connexion directe sans options complexes
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        // Enregistrer l'email pour une reconnexion ultérieure
        localStorage.setItem('last_logged_in_email', email);
        
        // Afficher un toast de confirmation
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${data.user.user_metadata?.full_name || email.split('@')[0] || 'utilisateur'}!`,
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
