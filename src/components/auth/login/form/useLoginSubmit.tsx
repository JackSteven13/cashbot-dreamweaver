
import * as React from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData, testSupabaseConnection } from "@/lib/supabase";

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
      
      // Tester la connexion à Supabase avant de tenter l'authentification
      const isConnected = await testSupabaseConnection();
      
      if (!isConnected) {
        console.error("Impossible de se connecter à Supabase");
        toast({
          title: "Problème de connexion",
          description: "Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Nettoyer toutes les données d'authentification avant de se connecter
      clearStoredAuthData();
      
      // Attendre un court instant pour permettre le nettoyage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Tentative de connexion avec méthode simplifiée
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
      
      if (data?.session) {
        console.log("Connexion réussie pour:", email);
        
        // Enregistrer l'email pour la prochaine connexion
        localStorage.setItem('last_logged_in_email', email);
        
        // Rediriger vers le tableau de bord avec un rechargement complet
        window.location.href = '/dashboard';
      } else {
        console.error("Session non créée après connexion");
        
        toast({
          title: "Erreur de session",
          description: "Impossible de créer une session. Veuillez réessayer.",
          variant: "destructive"
        });
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erreur inattendue:", error);
      
      toast({
        title: "Échec de connexion",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive"
      });
      
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
