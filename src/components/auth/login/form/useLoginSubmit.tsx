
import * as React from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData, checkSupabaseConnectivity } from "@/integrations/supabase/client";

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
      
      // Vérifier d'abord la connectivité réseau
      if (!navigator.onLine) {
        setFormError('Pas de connexion internet. Vérifiez votre connexion et réessayez.');
        setIsLoading(false);
        return;
      }
      
      // Attendre un court instant pour s'assurer que le nettoyage est effectué
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Vérifier la connectivité à Supabase avant de tenter la connexion
      console.log("Test de connectivité à Supabase...");
      const isConnected = await checkSupabaseConnectivity();
      
      if (!isConnected) {
        console.error("Problème de connexion au serveur Supabase");
        setFormError("Impossible de se connecter au serveur. Veuillez réessayer plus tard.");
        setIsLoading(false);
        return;
      }
      
      console.log("Connectivité Supabase OK, tentative de déconnexion préalable...");
      // Effectuer la déconnexion pour s'assurer qu'il n'y a pas de session active
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log("Déconnexion préalable effectuée");
      } catch (signOutErr) {
        console.log("Erreur lors de la déconnexion préalable:", signOutErr);
        // Continuer même en cas d'échec
      }
      
      // Attendre un court instant après la déconnexion
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Système de tentatives multiples
      let attempts = 0;
      const maxAttempts = 2;
      let authResult = null;
      let authError = null;
      
      while (attempts < maxAttempts) {
        try {
          console.log(`Tentative de connexion ${attempts + 1}/${maxAttempts}`);
          
          // Tentative de connexion avec l'API Supabase
          const result = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          
          authResult = result.data;
          authError = result.error;
          
          // Si pas d'erreur, sortir de la boucle
          if (!authError) break;
          
          // Si erreur, attendre avant nouvelle tentative
          console.error(`Erreur tentative ${attempts + 1}:`, authError);
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        } catch (error) {
          console.error(`Exception tentative ${attempts + 1}:`, error);
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }
      
      if (authError) {
        console.error("Erreur d'authentification après plusieurs tentatives:", authError);
        
        // Afficher un message d'erreur spécifique
        if (authError.message && authError.message.includes('Invalid login')) {
          setFormError('Email ou mot de passe incorrect.');
        } else if (authError.message && (authError.message.includes('network') || authError.message.includes('fetch'))) {
          setFormError('Problème de connexion au serveur. Vérifiez votre connexion et réessayez.');
        } else {
          setFormError(authError.message || 'Échec de connexion');
        }
        
        setIsLoading(false);
        return;
      }
      
      if (!authResult?.session) {
        console.error("Pas de session après connexion réussie");
        setFormError('Impossible de créer une session. Veuillez réessayer.');
        setIsLoading(false);
        return;
      }
      
      // Vérifier que la session contient un utilisateur valide
      if (authResult.session && authResult.session.user) {
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
