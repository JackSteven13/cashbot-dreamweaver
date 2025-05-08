
import * as React from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData, testSupabaseConnection } from "@/integrations/supabase/client";

export const useLoginSubmit = () => {
  const handleSubmit = async (
    e: React.FormEvent,
    email: string,
    password: string,
    setIsLoading: (isLoading: boolean) => void,
    setFormError: (error: string | null) => void
  ) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log("Tentative de connexion pour:", email);
      
      // Nettoyer toutes les données d'authentification existantes
      clearStoredAuthData();
      
      // Vérifier d'abord la connexion réseau
      if (!navigator.onLine) {
        setFormError('Pas de connexion internet. Vérifiez votre connexion et réessayez.');
        setIsLoading(false);
        return;
      }
      
      // Tester la connexion à Supabase
      console.log("Vérification de la connexion à Supabase...");
      const isSupabaseOnline = await testSupabaseConnection();
      
      if (!isSupabaseOnline) {
        setFormError('Le serveur est actuellement inaccessible. Veuillez réessayer dans quelques instants.');
        setIsLoading(false);
        return;
      }
      
      console.log("Tentative de connexion à Supabase...");
      
      // Attendre un instant pour s'assurer que la suppression des tokens est terminée
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Configuration du timeout manuel et du système d'annulation
      const controller = new AbortController();
      const loginTimeout = 15000; // 15 secondes
      const timeoutId = setTimeout(() => controller.abort(), loginTimeout);
      
      try {
        // Utilisation de l'API de base pour la connexion
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
        // Nettoyer le timeout
        clearTimeout(timeoutId);
        
        if (error) {
          console.error("Erreur d'authentification:", error);
          
          // Afficher un message d'erreur spécifique
          if (error.message && error.message.includes('Invalid login')) {
            setFormError('Email ou mot de passe incorrect.');
          } else if (error.message && (error.message.includes('network') || error.message.includes('fetch'))) {
            setFormError('Problème de connexion au serveur. Vérifiez votre connexion et réessayez.');
          } else {
            setFormError(error.message || 'Échec de connexion');
          }
          
          setIsLoading(false);
          return;
        }
        
        if (!data?.session) {
          console.error("Pas de session après connexion réussie");
          setFormError('Impossible de créer une session. Veuillez réessayer.');
          setIsLoading(false);
          return;
        }
        
        console.log("Connexion réussie pour:", email);
        
        // Enregistrer l'email pour la prochaine connexion
        localStorage.setItem('last_logged_in_email', email);
        
        // Toast de succès
        toast({
          title: "Connexion réussie",
          description: "Redirection vers le tableau de bord...",
          variant: "default"
        });
        
        // Attendre un court instant pour s'assurer que la session est bien enregistrée
        setTimeout(() => {
          // Redirection vers le tableau de bord
          window.location.href = '/dashboard';
        }, 1000);
        
        return;
      } catch (fetchError: any) {
        // Nettoyer le timeout
        clearTimeout(timeoutId);
        
        console.error("Erreur fetch:", fetchError);
        
        // Gestion spécifique des erreurs d'abandon
        if (fetchError.name === 'AbortError') {
          setFormError('La connexion a pris trop de temps. Le serveur peut être surchargé. Veuillez réessayer.');
        } else {
          setFormError('Problème de connexion au serveur. Vérifiez votre connexion et réessayez.');
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Erreur complète:", error);
      setFormError("Une erreur inattendue s'est produite. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
