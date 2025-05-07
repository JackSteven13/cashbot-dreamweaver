
import * as React from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

export const useLoginSubmit = () => {
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
      
      // Vérifier d'abord la connectivité réseau
      if (!navigator.onLine) {
        toast({
          title: "Pas de connexion internet",
          description: "Vérifiez votre connexion et réessayez.",
          variant: "destructive"
        });
        
        setIsLoading(false);
        return;
      }
      
      // Supprimer tout cache d'authentification existant pour éviter les conflits
      localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      
      // Tentative de connexion avec l'API Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error);
        
        toast({
          title: "Échec de connexion",
          description: "Email ou mot de passe incorrect.",
          variant: "destructive"
        });
        
        setIsLoading(false);
        return;
      }
      
      if (!data?.session) {
        console.error("Pas de session après connexion réussie");
        
        toast({
          title: "Erreur de session",
          description: "Impossible de créer une session. Veuillez réessayer.",
          variant: "destructive"
        });
        
        setIsLoading(false);
        return;
      }
      
      // Vérifier que la session contient un utilisateur valide
      if (data.session && data.session.user) {
        console.log("Connexion réussie pour:", email);
        
        // Enregistrer l'email pour la prochaine connexion
        localStorage.setItem('last_logged_in_email', email);
        
        // Attendre un court instant pour s'assurer que la session est bien enregistrée
        setTimeout(() => {
          // Redirection vers le tableau de bord
          window.location.href = '/dashboard';
        }, 100);
        
        return;
      }
      
      toast({
        title: "Erreur inattendue",
        description: "Veuillez réessayer ou contacter le support.",
        variant: "destructive"
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Erreur complète:", error);
      
      toast({
        title: "Échec de connexion",
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
        variant: "destructive"
      });
      
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
