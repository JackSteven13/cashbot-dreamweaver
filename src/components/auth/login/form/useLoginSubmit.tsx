
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData, isProductionEnvironment, forceRetrySigning } from "@/integrations/supabase/client";

export const useLoginSubmit = () => {
  const navigate = useNavigate();

  // Fonction pour vérifier manuellement si on est authentifié
  const checkAuthentication = async (): Promise<boolean> => {
    try {
      const { data } = await supabase.auth.getSession();
      return !!(data && data.session && data.session.user);
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
      console.log("Connexion en cours pour:", email);
      const isProduction = isProductionEnvironment();
      console.log("Environnement détecté:", isProduction ? "PRODUCTION" : "DÉVELOPPEMENT");
      
      // Nettoyage préventif radical
      await clearStoredAuthData();
      
      // Petit délai pour s'assurer que le nettoyage est effectif
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Stockage des tentatives pour gestion d'erreurs
      const retryCount = parseInt(localStorage.getItem('auth_retries') || '0');
      localStorage.setItem('auth_retries', (retryCount + 1).toString());
      
      // Stratégie de connexion universelle, simplifiée pour tous les environnements
      console.log("Tentative de connexion simplifiée");
      
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error);
        
        // Si erreur, essayer avec stratégie alternative
        if (error.message.includes('network') || 
            error.message.includes('fetch') || 
            error.message.includes('Failed') ||
            error.message.includes('timeout')) {
          
          console.log("Problème de réseau détecté, tentative de connexion alternative");
          
          // Vider à nouveau le stockage
          await clearStoredAuthData();
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Forcer un nouveau processus d'authentification
          await forceRetrySigning();
          
          // Nouvelle tentative directe
          const secondAttempt = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });
          
          if (secondAttempt.error) {
            throw secondAttempt.error;
          }
        } else {
          throw error;
        }
      }
      
      // Après connexion réussie, vérifier si la session est présente
      await new Promise(resolve => setTimeout(resolve, 800));
      const isAuthenticated = await checkAuthentication();
      
      if (!isAuthenticated) {
        console.warn("Session non trouvée après connexion réussie, tentative de récupération");
        
        // Tentative de récupération silencieuse
        await supabase.auth.refreshSession();
        
        // Seconde vérification
        const retryAuthentication = await checkAuthentication();
        if (!retryAuthentication) {
          console.error("Impossible de confirmer l'authentification après plusieurs essais");
        }
      }
      
      console.log("Connexion réussie pour:", email);
      
      // Enregistrer l'email pour la prochaine connexion
      localStorage.setItem('last_logged_in_email', email);
      localStorage.removeItem('auth_retries'); // Réinitialiser les compteurs de tentatives
      
      // Afficher un toast de réussite
      toast({
        title: "Connexion réussie",
        description: "Redirection vers votre tableau de bord...",
      });
      
      // Attendre un peu avant la redirection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirection vers le tableau de bord avec remplacement de l'historique
      console.log("Redirection vers le dashboard");
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error("Erreur complète:", error);
      
      // Message d'erreur adapté
      toast({
        title: "Échec de connexion",
        description: "Email ou mot de passe incorrect.",
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
