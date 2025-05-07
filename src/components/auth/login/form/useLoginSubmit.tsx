
import * as React from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData, testSupabaseConnection, testBackupEndpoints } from "@/lib/supabase";

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
      
      // Nettoyage initial des données d'authentification
      clearStoredAuthData();
      console.log("Nettoyage des données d'authentification effectué");
      
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
      let isConnected = await testSupabaseConnection(2);
      
      // Si la connexion directe échoue, essayer les points de terminaison alternatifs
      if (!isConnected) {
        console.log("Test des endpoints de secours...");
        isConnected = await testBackupEndpoints();
      }
      
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
      
      // Désactiver temporairement la vérification de l'état de la connexion pour forcer la connexion
      console.log("Connexion à Supabase confirmée, tentative d'authentification");
      
      try {
        console.log("Tentative d'authentification avec email et mot de passe");
        
        // Tentative d'authentification directe
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
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
      } catch (authError: any) {
        console.error("Erreur lors de la tentative de connexion:", authError);
        
        if (authError.name === 'AbortError') {
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
