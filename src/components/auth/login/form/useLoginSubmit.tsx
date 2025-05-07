
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
      
      // Supprimer tout cache d'authentification existant pour éviter les conflits
      localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      
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
      
      // Tentative de connexion avec retry automatique
      let attempts = 0;
      let success = false;
      let error;
      
      while (attempts < 2 && !success) {
        try {
          // Petit délai avant la deuxième tentative
          if (attempts > 0) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
          
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          
          if (authError) {
            error = authError;
          } else if (data?.session && data?.user) {
            success = true;
            error = null;
            break;
          }
        } catch (err) {
          error = err;
        }
        
        attempts++;
      }
      
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
      
      // Vérifier la présence d'une session après connexion
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session && sessionData?.session.user) {
        console.log("Connexion réussie pour:", email);
        
        // Enregistrer l'email pour la prochaine connexion
        localStorage.setItem('last_logged_in_email', email);
        
        // Redirection vers le tableau de bord avec un rechargement complet
        window.location.href = '/dashboard';
      } else {
        console.error("Pas de session après connexion réussie");
        
        toast({
          title: "Erreur de session",
          description: "Impossible de créer une session. Veuillez réessayer.",
          variant: "destructive"
        });
        
        setIsLoading(false);
      }
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
