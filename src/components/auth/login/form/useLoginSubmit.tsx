
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";

export const useLoginSubmit = () => {
  const navigate = useNavigate();
  
  // Fonction pour déterminer si on utilise un appareil mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

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

      // Authentification simplifiée - Tentative directe sans vérifications supplémentaires
      const authResult = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authResult.error) {
        throw authResult.error;
      }
      
      if (authResult?.data?.user) {
        // Stocker l'email pour faciliter les connexions futures
        localStorage.setItem('last_logged_in_email', email);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${authResult.data.user.user_metadata?.full_name || authResult.data.user.email?.split('@')[0] || 'utilisateur'}!`,
        });
        
        // Redirection immédiate vers le tableau de bord
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error("Échec de connexion: aucune donnée utilisateur retournée");
      }
    } catch (error: any) {
      console.error("Erreur détaillée de connexion:", error);
      
      // Messages d'erreur simplifiés pour une meilleure expérience utilisateur
      toast({
        title: "Erreur de connexion",
        description: "Email ou mot de passe incorrect. Veuillez réessayer.",
        variant: "destructive"
      });
      
      if (setIsLoading) {
        setIsLoading(false);
      }
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
