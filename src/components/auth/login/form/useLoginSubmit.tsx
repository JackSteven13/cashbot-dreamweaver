
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
      
      // Vérifier la connectivité internet
      if (!navigator.onLine) {
        throw new Error("Vous êtes actuellement hors ligne. Veuillez vérifier votre connexion internet.");
      }

      // Méthode d'authentification simplifiée pour les appareils mobiles
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
        
        // Redirection immédiate vers le tableau de bord
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error("Échec de connexion: aucune donnée utilisateur retournée");
      }
    } catch (error: any) {
      console.error("Erreur détaillée de connexion:", error);
      
      // Messages d'erreur améliorés et plus spécifiques
      if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError") || error.message?.includes("network") || error.status === 0) {
        toast({
          title: "Problème de connexion au serveur",
          description: "Impossible de contacter le serveur d'authentification. Veuillez vérifier votre connexion internet ou réessayer dans quelques instants.",
          variant: "destructive"
        });
      } else if (error.message?.includes("credentials") || error.status === 400) {
        toast({
          title: "Identifiants incorrects",
          description: "Email ou mot de passe incorrect",
          variant: "destructive"
        });
      } else if (error.message?.includes("CORS") || error.message?.includes("cross-origin")) {
        toast({
          title: "Erreur de configuration",
          description: "Problème de sécurité lors de la connexion. Veuillez essayer avec un autre navigateur ou contacter le support.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erreur de connexion",
          description: `${error.message || "Erreur inconnue"} (code: ${error.status || 'inconnu'})`,
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
