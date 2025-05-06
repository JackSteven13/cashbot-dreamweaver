
import * as React from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase, forceRetrySigning } from '@/integrations/supabase/client';
import { clearAuthData } from '@/lib/supabase';

export const useLoginSubmit = () => {
  const handleSubmit = async (
    e: React.FormEvent,
    email: string,
    password: string,
    setIsLoading: (isLoading: boolean) => void
  ) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Champs obligatoires",
        description: "Veuillez saisir votre email et votre mot de passe",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Préparation de la connexion");
      
      // Nettoyage complet avant la tentative
      clearAuthData();
      
      // Forcer une réinitialisation complète du client Supabase
      await forceRetrySigning();
      
      // Vérifier si le réseau est disponible
      if (!navigator.onLine) {
        throw new Error("Erreur de connexion réseau. Vérifiez votre connexion Internet.");
      }
      
      // Court délai pour assurer que le nettoyage est effectif
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Tentative de connexion pour:", email);
      
      // Tentative de connexion avec plusieurs essais en cas d'échec
      let attempts = 0;
      let success = false;
      
      while (attempts < 3 && !success) {
        try {
          // Utiliser un délai d'attente plus court pour chaque tentative
          const { data, error } = await Promise.race([
            supabase.auth.signInWithPassword({
              email: email.trim(),
              password: password,
            }),
            new Promise<{data: null, error: Error}>((_, reject) => 
              setTimeout(() => reject(new Error("Délai d'attente dépassé")), 8000)
            )
          ]) as any;
          
          if (error) {
            console.error(`Tentative ${attempts + 1} - Erreur:`, error.message);
            throw error;
          }

          if (!data.session) {
            console.error(`Tentative ${attempts + 1} - Pas de session retournée`);
            throw new Error("Aucune session n'a été créée");
          }
          
          success = true;
          console.log("Connexion réussie, session active");
          
          // Sauvegarder l'email pour la prochaine connexion
          localStorage.setItem('last_logged_in_email', email);
          
          // Notification de succès
          toast({
            title: "Connexion réussie",
            description: "Redirection vers votre tableau de bord...",
          });
          
          // Redirection après un court délai
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1200);
          
          return;
        } catch (attemptError) {
          attempts++;
          
          if (attempts < 3) {
            // Attendre avec backoff exponentiel avant de réessayer
            const delay = Math.min(1000 * Math.pow(1.5, attempts), 4000);
            console.log(`Nouvel essai dans ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Forcer une réinitialisation avant de réessayer
            await forceRetrySigning();
          }
        }
      }
      
      // Si on atteint ce point, c'est que toutes les tentatives ont échoué
      throw new Error("Échec de connexion après plusieurs tentatives");
      
    } catch (error: any) {
      console.error("Erreur d'authentification complète:", error);
      
      // Messages d'erreur plus précis selon le type d'erreur
      let errorMessage = "Email ou mot de passe incorrect.";
      
      if (error.message?.includes("fetch") || error.message?.includes("network") || !navigator.onLine || error.message?.includes("Failed to fetch")) {
        errorMessage = "Erreur de connexion réseau. Vérifiez votre connexion Internet.";
      } else if (error.message?.includes("timeout") || error.message?.includes("dépassé")) {
        errorMessage = "Délai de connexion dépassé. Veuillez réessayer.";
      } else if (error.message?.includes("token") || error.message?.includes("session")) {
        errorMessage = "Problème d'authentification. Veuillez réessayer.";
      }
      
      // Message d'erreur adapté
      toast({
        title: "Échec de connexion",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Nettoyage après échec
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
