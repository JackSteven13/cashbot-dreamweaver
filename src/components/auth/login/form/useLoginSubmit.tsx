
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
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
    
    // Nettoyer complètement les données d'authentification stockées
    clearStoredAuthData();
    
    try {
      console.log("Tentative de connexion pour:", email);
      
      // Version ultra simplifiée - sans options qui causent des erreurs
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        // Sauvegarder l'email pour les futures connexions
        localStorage.setItem('last_logged_in_email', email);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'utilisateur'}!`,
        });
        
        // Redirection directe vers le dashboard
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error("Échec de connexion: aucune donnée utilisateur retournée");
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      
      if (error.message === "Invalid login credentials" || error.message?.includes("credentials")) {
        toast({
          title: "Identifiants incorrects",
          description: "Email ou mot de passe incorrect",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter. Veuillez réessayer.",
          variant: "destructive",
          action: <ToastAction altText="Réessayer" onClick={() => window.location.reload()}>
            Réessayer
          </ToastAction>
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
