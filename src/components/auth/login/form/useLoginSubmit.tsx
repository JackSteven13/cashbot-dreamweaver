
import * as React from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";

export const useLoginSubmit = () => {
  const handleSubmit = async (
    e: React.FormEvent,
    email: string,
    password: string,
    setIsLoading: (isLoading: boolean) => void,
    setFormError: (error: string | null) => void
  ) => {
    e.preventDefault();
    
    try {
      console.log("Tentative de connexion pour:", email);
      
      // Nettoyer toutes les données d'authentification existantes
      clearStoredAuthData();
      
      // Vérifier la connexion internet
      if (!navigator.onLine) {
        setFormError('Pas de connexion internet. Vérifiez votre connexion et réessayez.');
        setIsLoading(false);
        return;
      }
      
      // Connexion à Supabase sans options qui pourraient causer des conflits
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        if (error.message?.includes('Invalid login')) {
          setFormError('Email ou mot de passe incorrect.');
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
      
      // Enregistrer l'email pour la prochaine connexion
      localStorage.setItem('last_logged_in_email', email);
      
      // Toast de succès
      toast({
        title: "Connexion réussie",
        description: "Redirection vers le tableau de bord...",
        variant: "default"
      });
      
      // Redirection vers le tableau de bord avec rafraîchissement complet
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (error) {
      console.error("Erreur complète:", error);
      setFormError("Une erreur inattendue s'est produite. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
