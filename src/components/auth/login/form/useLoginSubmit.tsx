
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, forceRetrySigning } from "@/integrations/supabase/client";

export const useLoginSubmit = () => {
  const navigate = useNavigate();

  // Fonction améliorée pour vérifier si la connexion internet est disponible
  const checkInternetConnection = async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }
    
    try {
      // Use the Supabase URL from the environment or a hardcoded value instead of accessing supabaseUrl directly
      const supabaseApiUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://cfjibduhagxiwqkiyhqd.supabase.co'}/auth/v1/`;
      
      // Tenter une requête simple vers Supabase pour vérifier la connectivité réelle
      await fetch(supabaseApiUrl, { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store'
      });
      return true;
    } catch (e) {
      return navigator.onLine; // Fallback sur l'état du navigateur
    }
  };

  // Fonction simplifiée pour vérifier l'authentification
  const checkAuthentication = async (): Promise<boolean> => {
    try {
      const { data } = await supabase.auth.getSession();
      return !!(data && data.session);
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    email: string,
    password: string,
    setIsLoading: (isLoading: boolean) => void
  ) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Vérifier la connexion internet d'abord
      const isOnline = await checkInternetConnection();
      if (!isOnline) {
        toast({
          title: "Erreur de connexion",
          description: "Veuillez vérifier votre connexion internet et réessayer.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      console.log("Tentative de connexion pour:", email);
      
      // Nettoyage plus agressif avant la tentative de connexion
      await forceRetrySigning();
      
      // Tentative de connexion avec timeout pour éviter les blocages
      const loginPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      // Créer un timeout de 15 secondes
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Délai d'attente dépassé")), 15000);
      });
      
      // Course entre la connexion et le timeout
      const { error } = await Promise.race([
        loginPromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        console.error("Erreur d'authentification:", error.message);
        
        if (error.message.includes('network') || 
            error.message.includes('fetch') || 
            error.message.includes('Failed') ||
            error.message.includes('timeout')) {
          
          toast({
            title: "Problème de connexion",
            description: "Impossible de communiquer avec le serveur d'authentification. Veuillez vérifier votre connexion internet.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        throw error;
      }
      
      // Vérifier que la session est bien établie, avec plusieurs tentatives
      let isAuthenticated = false;
      let attempts = 0;
      
      while (!isAuthenticated && attempts < 3) {
        await new Promise(resolve => setTimeout(resolve, 500));
        isAuthenticated = await checkAuthentication();
        attempts++;
      }
      
      if (!isAuthenticated) {
        console.warn("Session non établie après connexion apparemment réussie");
        
        // Tentative de récupération
        try {
          await supabase.auth.refreshSession();
          isAuthenticated = await checkAuthentication();
        } catch (refreshError) {
          console.error("Erreur lors du rafraîchissement de la session:", refreshError);
        }
        
        if (!isAuthenticated) {
          toast({
            title: "Problème de synchronisation",
            description: "Votre connexion a été acceptée mais la session n'a pas pu être établie. Veuillez réessayer.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      }
      
      console.log("Connexion réussie");
      
      // Sauvegarder l'email pour la prochaine connexion
      localStorage.setItem('last_logged_in_email', email);
      
      // Notification de succès
      toast({
        title: "Connexion réussie",
        description: "Redirection vers votre tableau de bord...",
      });
      
      // Attendre avant la redirection
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Force reload pour garantir un état propre
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error("Erreur complète:", error);
      
      // Message d'erreur adapté
      if (error.message?.includes('timeout') || error.message?.includes('Délai')) {
        toast({
          title: "Délai d'attente dépassé",
          description: "Le serveur met trop de temps à répondre. Veuillez réessayer plus tard.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Échec de connexion",
          description: "Email ou mot de passe incorrect.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
