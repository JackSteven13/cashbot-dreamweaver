
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData, isProductionEnvironment, forceRetrySigning } from "@/integrations/supabase/client";

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
      const isProduction = isProductionEnvironment();
      console.log("Environnement détecté:", isProduction ? "PRODUCTION" : "DÉVELOPPEMENT");
      
      // Nettoyage préventif radical
      clearStoredAuthData();
      
      // Petit délai pour s'assurer que le nettoyage est effectif
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // En production, utiliser des options spécifiquement adaptées
      const authOptions = isProduction 
        ? {
            // Options spécifiques à la production
            emailRedirectTo: `https://streamgenius.io/dashboard`,
            data: {
              // Métadonnées additionnelles pour traçage des problèmes
              login_from: 'production',
              login_timestamp: new Date().toISOString()
            }
          }
        : undefined;
          
      // Authentification adaptée selon l'environnement
      console.log("Options d'authentification:", authOptions || "standards");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error);
        
        // En production, essayer une seconde tentative avec nettoyage plus radical
        if (isProduction) {
          console.log("Échec en production, tentative de seconde chance");
          
          // Attendre un peu plus entre les tentatives en production
          await forceRetrySigning();
          
          // Seconde tentative
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });
          
          if (retryError) {
            console.error("Échec de la seconde tentative:", retryError);
            throw new Error(retryError.message || "Erreur de connexion persistante");
          }
          
          if (!retryData || !retryData.user || !retryData.session) {
            throw new Error("Données d'authentification incomplètes après seconde tentative");
          }
          
          // Utiliser les données de la seconde tentative
          data.user = retryData.user;
          data.session = retryData.session;
          console.log("Seconde tentative réussie!");
        } else {
          throw new Error(error.message || "Erreur de connexion");
        }
      }
      
      if (!data || !data.user || !data.session) {
        console.error("Données d'authentification incomplètes");
        throw new Error("Données d'authentification incomplètes");
      }
      
      console.log("Connexion réussie pour:", data.user.email);
      
      // Enregistrer l'email pour la prochaine connexion
      localStorage.setItem('last_logged_in_email', email);
      
      // Stockage explicite des tokens pour une meilleure persistance
      try {
        localStorage.setItem(
          isProduction ? 'sb-auth-token-prod' : 'sb-cfjibduhagxiwqkiyhqd-auth-token',
          JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at
          })
        );
        
        // Sauvegarder aussi les informations utilisateur
        localStorage.setItem('auth_user_id', data.user.id);
        localStorage.setItem('auth_user_email', data.user.email || '');
      } catch (e) {
        console.error("Erreur lors du stockage manuel de la session:", e);
      }
      
      // Afficher un toast de réussite
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${data.user.user_metadata?.full_name || ''}!`,
      });
      
      // Attendre plus longtemps en production pour s'assurer que la session est bien établie
      await new Promise(resolve => setTimeout(resolve, isProduction ? 2000 : 800));
      
      // Vérification explicite que la session est bien enregistrée
      const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionCheck.session) {
        console.warn("Session non trouvée après connexion, tentative de correction");
        
        // En production, forcer un nouveau stockage des tokens
        if (isProduction) {
          try {
            localStorage.setItem(
              'sb-auth-token-prod',
              JSON.stringify({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at
              })
            );
            
            console.log("Tokens forcés manuellement en localStorage");
          } catch (e) {
            console.error("Échec du forçage manuel des tokens:", e);
          }
        }
        
        // Nouvelle vérification après correction
        const sessionResult = await supabase.auth.getSession();
        
        if (!sessionResult.data.session) {
          console.error("Impossible de confirmer la session après correction");
          
          if (isProduction) {
            // En production, procéder tout de même à la redirection avec un avertissement
            toast({
              title: "Authentification incomplète",
              description: "La session pourrait être instable, contactez le support si nécessaire.",
              variant: "destructive"
            });
          } else {
            // En développement, bloquer et demander une reconnexion
            throw new Error("Session non persistante après reconnexion");
          }
        } else {
          console.log("Session vérifiée après correction");
        }
      }
      
      // Redirection vers le tableau de bord avec remplacement de l'historique
      console.log("Redirection vers le dashboard");
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

