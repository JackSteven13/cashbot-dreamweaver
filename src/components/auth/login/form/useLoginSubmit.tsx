
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
      
      console.log("Tentative de connexion à Supabase...");
      
      // Attendre un instant pour s'assurer que la suppression des tokens est terminée
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Effectuer la connexion avec l'API Supabase avec plus de timeout
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        new Promise<{data: null, error: any}>((resolve) => {
          setTimeout(() => resolve({
            data: null, 
            error: { message: 'Délai de connexion expiré. Le serveur met trop de temps à répondre.' }
          }), 15000); // 15 secondes timeout
        })
      ]) as any;
      
      if (error) {
        console.error("Erreur d'authentification:", error);
        
        // Afficher un message d'erreur spécifique
        if (error.message && error.message.includes('Invalid login')) {
          setFormError('Email ou mot de passe incorrect.');
        } else if (error.message && (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Délai'))) {
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
      
      // Vérifier que la session contient un utilisateur valide
      if (data.session && data.session.user) {
        console.log("Connexion réussie pour:", email);
        
        // Enregistrer l'email pour la prochaine connexion
        localStorage.setItem('last_logged_in_email', email);
        
        // Attendre un court instant pour s'assurer que la session est bien enregistrée
        setTimeout(() => {
          // Redirection vers le tableau de bord
          window.location.href = '/dashboard';
        }, 800);
        
        return;
      }
      
      setFormError('Erreur inattendue. Veuillez réessayer ou contacter le support.');
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
