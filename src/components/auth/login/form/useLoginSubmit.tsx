
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
      
      // Vérifier la connexion Internet du navigateur
      if (!navigator.onLine) {
        console.error("Pas de connexion Internet");
        toast({
          title: "Problème de connexion",
          description: "Veuillez vérifier votre connexion Internet et réessayer.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Tester la connexion à Supabase avant de tenter l'authentification
      console.log("Test de connexion à Supabase...");
      const isConnected = await testSupabaseConnection();
      
      if (!isConnected) {
        console.error("Impossible de se connecter à Supabase");
        toast({
          title: "Serveur inaccessible",
          description: "Impossible de contacter le serveur d'authentification. Veuillez réessayer ultérieurement.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Nettoyer toutes les données d'authentification avant de se connecter
      clearStoredAuthData();
      
      // Attendre un court instant pour permettre le nettoyage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Tentative de connexion avec méthode simplifiée et timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error("Erreur d'authentification:", error);
          
          // Fournir des messages d'erreur plus spécifiques en fonction de l'erreur
          if (error.message.includes("Invalid login")) {
            toast({
              title: "Échec de connexion",
              description: "Email ou mot de passe incorrect.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Échec de connexion",
              description: "Une erreur est survenue lors de la tentative de connexion.",
              variant: "destructive"
            });
          }
          
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
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        console.error("Erreur lors de la tentative de connexion:", fetchError);
        
        if (fetchError.name === 'AbortError') {
          toast({
            title: "Délai dépassé",
            description: "La tentative de connexion a pris trop de temps. Veuillez réessayer.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Échec de connexion",
            description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
            variant: "destructive"
          });
        }
        
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
