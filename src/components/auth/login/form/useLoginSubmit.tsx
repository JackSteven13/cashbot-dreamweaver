
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
      
      // Tentative d'authentification améliorée avec détection d'environnement
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
      
      // Délai supplémentaire en production pour s'assurer que la session est bien enregistrée
      if (isProduction) {
        console.log("Environnement de production détecté, délai supplémentaire");
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Double vérification de la session avant redirection
      const { data: sessionCheck } = await supabase.auth.getSession();
      
      if (!sessionCheck.session) {
        console.warn("Session non trouvée après connexion, tentative de correction");
        
        // Tentative supplémentaire de rafraîchissement
        await supabase.auth.refreshSession();
        
        // Vérification finale
        const { data: finalCheck } = await supabase.auth.getSession();
        
        if (!finalCheck.session) {
          console.error("Impossible de confirmer la session après plusieurs tentatives");
          throw new Error("Session non persistante après connexion");
        } else {
          console.log("Session vérifiée après correction");
        }
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
