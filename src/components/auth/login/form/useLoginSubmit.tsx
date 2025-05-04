
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData, createLightClient } from "@/integrations/supabase/client";

export const useLoginSubmit = () => {
  const navigate = useNavigate();
  
  // Fonction pour déterminer si on utilise un appareil mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleSubmit = async (
    e: React.FormEvent,
    email: string,
    password: string,
    setIsLoading: (isLoading: boolean) => void
  ) => {
    e.preventDefault();
    
    if (setIsLoading) {
      setIsLoading(true);
    }
    
    // Nettoyage radical des données d'authentification avant la tentative
    clearStoredAuthData();
    
    try {
      console.log("Tentative de connexion pour:", email);
      
      // Vérifier la connectivité internet
      if (!navigator.onLine) {
        throw new Error("Vous êtes actuellement hors ligne. Veuillez vérifier votre connexion internet.");
      }

      // Déterminer si on utilise un appareil mobile
      const isMobile = isMobileDevice();
      let authResult;
      
      if (isMobile) {
        // Stratégie spéciale pour les appareils mobiles
        console.log("Utilisation de la stratégie mobile pour l'authentification");
        
        // Réessayer plusieurs fois avec des délais croissants
        let attempts = 0;
        const maxAttempts = 3;
        let success = false;
        
        while (attempts < maxAttempts && !success) {
          try {
            console.log(`Tentative mobile ${attempts + 1}/${maxAttempts}`);
            
            // Utiliser une connexion légère pour la première tentative
            if (attempts === 0) {
              const lightClient = createLightClient();
              authResult = await lightClient.auth.signInWithPassword({
                email,
                password,
              });
            } else {
              // Utiliser la connexion standard pour les tentatives suivantes
              authResult = await supabase.auth.signInWithPassword({
                email,
                password
              });
            }
            
            if (authResult.error) {
              throw authResult.error;
            }
            
            success = true;
          } catch (attemptError) {
            console.error(`Erreur lors de la tentative ${attempts + 1}:`, attemptError);
            attempts++;
            
            if (attempts < maxAttempts) {
              // Attendre avant la prochaine tentative (délai exponentiel)
              const delay = Math.min(500 * Math.pow(2, attempts), 4000);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        if (!success) {
          throw new Error("Échec après plusieurs tentatives. Veuillez réessayer.");
        }
      } else {
        // Authentification standard pour les appareils non mobiles
        authResult = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (authResult.error) {
          throw authResult.error;
        }
      }
      
      if (authResult?.data?.user) {
        // Stocker l'email pour faciliter les connexions futures
        localStorage.setItem('last_logged_in_email', email);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${authResult.data.user.user_metadata?.full_name || authResult.data.user.email?.split('@')[0] || 'utilisateur'}!`,
        });
        
        // Redirection immédiate vers le tableau de bord
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error("Échec de connexion: aucune donnée utilisateur retournée");
      }
    } catch (error: any) {
      console.error("Erreur détaillée de connexion:", error);
      
      // Adapter le message d'erreur en fonction du type d'erreur
      let errorTitle = "Erreur de connexion";
      let errorMessage = "Veuillez réessayer dans quelques instants.";
      
      // Détection spécifique des erreurs réseau
      const isNetworkError = 
        error.message?.includes("fetch") || 
        error.message?.includes("network") || 
        error.message?.includes("Failed to") ||
        error.message?.includes("NetworkError") || 
        !navigator.onLine;
      
      // Messages d'erreur améliorés et plus spécifiques
      if (isNetworkError) {
        errorTitle = "Problème de connexion au serveur";
        errorMessage = "Impossible de contacter le serveur d'authentification. Veuillez vérifier votre connexion internet ou réessayer dans quelques instants.";
      } else if (error.message?.includes("credentials") || error.status === 400 || error.code === 'auth/invalid-credential') {
        errorTitle = "Identifiants incorrects";
        errorMessage = "Email ou mot de passe incorrect";
      } else if (error.message?.includes("CORS") || error.message?.includes("cross-origin")) {
        errorTitle = "Erreur de configuration";
        errorMessage = "Problème de sécurité lors de la connexion. Veuillez essayer avec un autre navigateur ou contacter le support.";
      } else if (error.message?.includes("too many requests") || error.status === 429) {
        errorTitle = "Trop de tentatives";
        errorMessage = "Veuillez patienter quelques instants avant de réessayer.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
      
      if (setIsLoading) {
        setIsLoading(false);
      }
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
