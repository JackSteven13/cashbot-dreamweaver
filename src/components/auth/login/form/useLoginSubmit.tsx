
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";

export const useLoginSubmit = () => {
  const navigate = useNavigate();

  const handleSubmit = async (
    e: React.FormEvent,
    email: string,
    password: string,
    setIsLoading: (isLoading: boolean) => void
  ) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log("Connexion en cours pour:", email);
      
      // Nettoyage préventif
      clearStoredAuthData();
      
      // Petit délai pour s'assurer que le nettoyage est effectif
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Authentification directe sans options supplémentaires pour maximiser la compatibilité
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error);
        throw new Error(error.message || "Erreur de connexion");
      }
      
      if (!data || !data.user || !data.session) {
        console.error("Données d'authentification incomplètes");
        throw new Error("Données d'authentification incomplètes");
      }
      
      console.log("Connexion réussie pour:", data.user.email);
      
      // Enregistrer l'email pour la prochaine connexion
      localStorage.setItem('last_logged_in_email', email);
      
      // Vérifier si nous sommes en production (streamgenius.io)
      const isProduction = window.location.hostname.includes('streamgenius.io');
      
      // Afficher un toast de réussite
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${data.user.user_metadata?.full_name || ''}!`,
      });
      
      // Attendre un peu plus longtemps en production pour s'assurer que la session est bien établie
      if (isProduction) {
        console.log("Environnement de production détecté, délai supplémentaire");
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Vérification explicite que la session est bien enregistrée
      const { data: sessionCheck } = await supabase.auth.getSession();
      
      if (!sessionCheck.session) {
        console.warn("Session non trouvée après connexion, tentative de correction");
        
        // Utilisation de la méthode getSession qui est plus fiable pour la vérification
        const sessionResult = await supabase.auth.getSession();
        
        if (!sessionResult.data.session) {
          console.error("Impossible de confirmer la session après plusieurs tentatives");
          
          // En dernier recours, essayons une reconnexion simplifiée
          const reloginAttempt = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });
          
          if (!reloginAttempt.data.session) {
            throw new Error("Session non persistante après reconnexion");
          } else {
            console.log("Reconnexion réussie");
          }
        } else {
          console.log("Session vérifiée après correction");
        }
      }
      
      // Stocker explicitement la session dans localStorage pour une meilleure persistance
      try {
        if (data.session) {
          const sessionStr = JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
          localStorage.setItem('supabase.auth.token', sessionStr);
        }
      } catch (e) {
        console.error("Erreur lors du stockage de la session:", e);
      }
      
      // Redirection vers le tableau de bord avec remplacement de l'historique
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error("Erreur complète:", error);
      
      // Message d'erreur par défaut
      let errorMessage = "Email ou mot de passe incorrect.";
      
      // Notification d'erreur
      toast({
        title: "Échec de connexion",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Nettoyage après échec
      clearStoredAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
