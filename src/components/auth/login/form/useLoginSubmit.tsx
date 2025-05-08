
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
      
      // Nettoyer toutes les données d'authentification existantes
      clearStoredAuthData();
      
      // Vérifier la connexion internet
      if (!navigator.onLine) {
        setFormError('Pas de connexion internet. Vérifiez votre connexion et réessayez.');
        setIsLoading(false);
        return;
      }
      
      // Connexion à Supabase avec gestion du délai d'attente
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes maximum
        
        // Connexion avec mécanisme de repli
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            // Connexion à Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
            
            clearTimeout(timeoutId);
            
            if (error) {
              console.error(`Erreur d'authentification (tentative ${attempt + 1}):`, error);
              
              if (error.message?.includes('Invalid login')) {
                setFormError('Email ou mot de passe incorrect.');
                setIsLoading(false);
                return;
              } else if (error.message?.includes('Server closed') || error.message?.includes('Connection')) {
                // En cas d'erreur de serveur, réessayer une fois
                if (attempt === 0) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  continue;
                }
                setFormError('Le service d\'authentification est momentanément indisponible. Veuillez réessayer dans quelques instants.');
                setIsLoading(false);
                return;
              } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
                setFormError('Problème de connexion au serveur. Vérifiez votre connexion et réessayez.');
                setIsLoading(false);
                return;
              } else {
                setFormError(error.message || 'Échec de connexion');
                setIsLoading(false);
                return;
              }
            }
            
            if (!data?.session) {
              console.error("Pas de session après connexion réussie");
              setFormError('Impossible de créer une session. Veuillez réessayer.');
              setIsLoading(false);
              return;
            }
            
            console.log("Connexion réussie pour:", email);
            
            // Enregistrer l'email pour la prochaine connexion
            localStorage.setItem('last_logged_in_email', email);
            
            // Toast de succès
            toast({
              title: "Connexion réussie",
              description: "Redirection vers le tableau de bord...",
              variant: "default"
            });
            
            // Redirection vers le tableau de bord
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 1000);
            
            // Connexion réussie, sortir de la boucle
            break;
          } catch (innerError) {
            console.error(`Erreur lors de la tentative ${attempt + 1}:`, innerError);
            
            if (attempt === 1) {
              setFormError("Le service d'authentification est temporairement indisponible. Veuillez réessayer plus tard.");
              setIsLoading(false);
              return;
            }
            
            // Attendre avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (abortError) {
        console.error("Délai d'attente dépassé:", abortError);
        setFormError("Le serveur met trop de temps à répondre. Veuillez réessayer.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erreur complète:", error);
      setFormError("Une erreur inattendue s'est produite. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
