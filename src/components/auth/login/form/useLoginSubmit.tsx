
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
    
    // Nettoyage radical des données d'authentification avant la tentative
    clearStoredAuthData();
    
    try {
      console.log("Tentative de connexion pour:", email);
      
      // Délai pour stabiliser
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Version simplifiée d'authentification sans l'option redirectTo
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error);
        throw error;
      }
      
      if (data.user) {
        // Stocker l'email pour faciliter les connexions futures
        localStorage.setItem('last_logged_in_email', email);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'utilisateur'}!`,
        });
        
        // Délai important avant redirection pour assurer que la session est bien établie
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        throw new Error("Échec de connexion: aucune donnée utilisateur retournée");
      }
    } catch (error: any) {
      console.error("Erreur détaillée de connexion:", error);
      
      // Messages d'erreur plus détaillés
      if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
        toast({
          title: "Erreur de connexion réseau",
          description: "Impossible de contacter le serveur d'authentification. Vérifiez votre connexion.",
          variant: "destructive"
        });
      } else if (error.message === "Invalid login credentials" || error.message?.includes("credentials")) {
        toast({
          title: "Identifiants incorrects",
          description: "Email ou mot de passe incorrect",
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
