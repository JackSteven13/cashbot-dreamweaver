
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
    
    if (setIsLoading) {
      setIsLoading(true);
    }
    
    // Nettoyage complet des données d'authentification avant la tentative
    clearStoredAuthData();
    
    try {
      console.log("Tentative de connexion pour:", email);
      
      // Ajouter un délai pour éviter les problèmes de timing - solution clé
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Utilisation ultra-simplifiée de l'API d'authentification
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        localStorage.setItem('last_logged_in_email', email);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'utilisateur'}!`,
        });
        
        // Attendre un peu plus longtemps avant la redirection pour assurer l'établissement de la session
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      } else {
        throw new Error("Échec de connexion: aucune donnée utilisateur retournée");
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      
      // Messages d'erreur plus informatifs
      if (error.message === "Invalid login credentials" || error.message?.includes("credentials")) {
        toast({
          title: "Identifiants incorrects",
          description: "Email ou mot de passe incorrect",
          variant: "destructive"
        });
      } else if (error.message?.includes("fetch") || error.message?.includes("network")) {
        toast({
          title: "Erreur de connexion réseau",
          description: "Impossible de contacter le serveur d'authentification. Vérifiez votre connexion.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erreur de connexion",
          description: `Impossible de se connecter: ${error.message || "Erreur inconnue"}`,
          variant: "destructive"
        });
      }
      
      if (setIsLoading) {
        setIsLoading(false);
      }
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
