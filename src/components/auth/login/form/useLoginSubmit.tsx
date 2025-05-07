
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
      
      // Vérifier d'abord la connectivité réseau
      if (!navigator.onLine) {
        setFormError('Pas de connexion internet. Vérifiez votre connexion et réessayez.');
        setIsLoading(false);
        return;
      }
      
      // Nettoyer toutes les données d'authentification existantes
      clearStoredAuthData();
      
      // Attendre un court instant pour s'assurer que le nettoyage est effectué
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Effectuer un test de connectivité à Supabase avant la tentative de connexion
        const connectionTest = await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/rest/v1/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4'
          }
        });
        
        if (!connectionTest.ok) {
          console.error("Test de connectivité Supabase échoué:", await connectionTest.text());
          setFormError("Impossible de se connecter au serveur. Veuillez réessayer plus tard.");
          setIsLoading(false);
          return;
        }
      } catch (connError) {
        console.error("Erreur de test de connectivité:", connError);
        setFormError("Problème de connexion au serveur. Vérifiez votre connexion internet.");
        setIsLoading(false);
        return;
      }
      
      // Effectuer la déconnexion pour s'assurer qu'il n'y a pas de session active
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log("Déconnexion préalable effectuée");
      } catch (signOutErr) {
        console.log("Erreur lors de la déconnexion préalable:", signOutErr);
        // Continuer même en cas d'échec
      }
      
      // Attendre un court instant après la déconnexion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Tentative de connexion avec l'API Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error);
        
        // Afficher un message d'erreur spécifique
        if (error.message.includes('Invalid login')) {
          setFormError('Email ou mot de passe incorrect.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
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
