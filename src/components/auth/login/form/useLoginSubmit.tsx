
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
      
      // En production, utiliser une stratégie de connexion plus sophistiquée
      if (isProduction) {
        console.log("Stratégie de connexion spéciale pour la production");
        
        try {
          // Première tentative avec options simplifiées
          const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });
          
          if (error) {
            console.error("Première tentative d'authentification échouée:", error);
            
            // Si l'erreur semble liée au réseau, essayer avec une connexion simplifiée
            if (error.message.includes('network') || 
                error.message.includes('fetch') || 
                error.message.includes('Failed') ||
                error.message.includes('timeout')) {
              
              // Nettoyer à nouveau
              await clearStoredAuthData();
              
              // Forcer la définition manuelle du localStorage après connexion réussie
              console.log("Tentative de stockage manuel des informations d'authentification");
              
              // Tenter de se connecter avec une approche plus directe
              const baseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co/auth/v1';
              const headers = {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4'
              };
              
              const response = await fetch(`${baseUrl}/token?grant_type=password`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                  email: email.trim(),
                  password: password
                }),
                credentials: 'omit' // Ne pas envoyer les cookies
              });
              
              if (!response.ok) {
                console.error("Échec de la connexion directe:", response.status);
                throw new Error("Échec de connexion après plusieurs tentatives");
              }
              
              const authData = await response.json();
              
              if (!authData.access_token || !authData.refresh_token) {
                console.error("Données d'authentification incomplètes:", authData);
                throw new Error("Données d'authentification incomplètes");
              }
              
              // Stocker manuellement les tokens
              localStorage.setItem('sb-auth-token-prod', JSON.stringify({
                access_token: authData.access_token,
                refresh_token: authData.refresh_token,
                expires_at: Math.floor(Date.now() / 1000) + authData.expires_in
              }));
              
              console.log("Authentification manuelle réussie");
              
              // Vérifier l'authentification
              await new Promise(resolve => setTimeout(resolve, 800));
              const isAuthenticated = await checkAuthentication();
              
              if (!isAuthenticated) {
                console.error("Vérification d'authentification manuelle échouée");
                throw new Error("Impossible de confirmer l'authentification");
              }
            } else {
              throw error; // Autres erreurs non liées au réseau
            }
          }
          
          // Après connexion réussie, vérifier si la session est présente
          await new Promise(resolve => setTimeout(resolve, 800));
          const isAuthenticated = await checkAuthentication();
          
          if (!isAuthenticated) {
            console.warn("Session non trouvée après connexion réussie");
            // Afficher un avertissement mais continuer
            toast({
              title: "Attention",
              description: "Connexion réussie mais session instable. Rechargement automatique possible.",
              variant: "default"
            });
          }
        } catch (error: any) {
          console.error("Erreur complète:", error);
          toast({
            title: "Échec de connexion",
            description: "Email ou mot de passe incorrect, ou problème de réseau.",
            variant: "destructive"
          });
          
          // Nettoyer après échec
          clearStoredAuthData();
          setIsLoading(false);
          return;
        }
      } else {
        // En développement, processus standard
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        
        if (error) {
          console.error("Erreur d'authentification:", error);
          toast({
            title: "Échec de connexion",
            description: "Email ou mot de passe incorrect.",
            variant: "destructive"
          });
          
          clearStoredAuthData();
          setIsLoading(false);
          return;
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
      
      // Attendre plus longtemps en production pour s'assurer que la session est bien établie
      await new Promise(resolve => setTimeout(resolve, isProductionEnvironment() ? 1500 : 800));
      
      // Redirection vers le tableau de bord avec remplacement de l'historique
      console.log("Redirection vers le dashboard");
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error("Erreur complète:", error);
      
      // Message d'erreur adapté
      let errorMessage = "Email ou mot de passe incorrect, ou problème de connexion.";
      
      // En production, gérer différemment les erreurs réseau
      if (isProductionEnvironment() && (error.message?.includes('network') || error.message?.includes('fetch'))) {
        errorMessage = "Problème de connexion au serveur d'authentification. Veuillez vérifier votre connexion internet.";
      }
      
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
