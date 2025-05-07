
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData } from "@/lib/supabase";

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
      console.log("Tentative de connexion pour:", email);
      
      // Nettoyer les données d'auth existantes
      clearStoredAuthData();
      
      // Attendre un court instant pour s'assurer du nettoyage complet
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Connexion avec des options simplifiées
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error);
        
        // Log failed connection attempt - Using direct fetch to avoid Supabase client issues
        try {
          // Send log request directly with minimal headers and no auth token
          const response = await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/functions/v1/log-connection', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: email,
              success: false,
              error_message: error.message
            })
          });
          
          if (!response.ok) {
            console.error("Failed to log connection error: Response not OK", await response.text());
          } else {
            console.log("Failed connection logged successfully");
          }
        } catch (logErr) {
          console.error("Exception when logging connection failure:", logErr);
        }
        
        // Message d'erreur adapté
        toast({
          title: "Échec de connexion",
          description: "Email ou mot de passe incorrect.",
          variant: "destructive"
        });
        
        // Nettoyage après échec
        clearStoredAuthData();
        
        // Sortie en fin de tentative échouée
        setIsLoading(false);
        return;
      }
      
      // Vérifier la présence d'une session après connexion
      if (data.session && data.user) {
        console.log("Connexion réussie pour:", email);
        
        // Enregistrer l'email pour la prochaine connexion
        localStorage.setItem('last_logged_in_email', email);
        
        // Log successful connection via direct fetch without auth token
        try {
          const response = await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/functions/v1/log-connection', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: email,
              success: true,
              user_id: data.user.id,
              error_message: null
            })
          });
          
          if (!response.ok) {
            console.error("Failed to log connection: Response not OK", await response.text());
          } else {
            console.log("Connection logged successfully");
          }
        } catch (logErr) {
          console.error("Exception when logging connection:", logErr);
          // Non-fatal error, continue with login process
        }
        
        // Afficher un toast de réussite
        toast({
          title: "Connexion réussie",
          description: "Redirection vers votre tableau de bord...",
        });
        
        // Petit délai pour permettre au toast d'être visible
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Redirection vers le tableau de bord
        navigate('/dashboard', { replace: true });
      } else {
        console.error("Pas de session après connexion réussie");
        throw new Error("Échec de création de session");
      }
    } catch (error) {
      console.error("Erreur complète:", error);
      
      // Tenter d'enregistrer l'échec même en cas d'erreur générale
      try {
        const response = await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/functions/v1/log-connection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email,
            success: false,
            error_message: error instanceof Error ? error.message : "Erreur inconnue"
          })
        });
        
        if (!response.ok) {
          console.error("Failed to log connection error in catch block: Response not OK", await response.text());
        }
      } catch (logErr) {
        console.error("Impossible d'enregistrer l'échec de connexion:", logErr);
      }
      
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
