
import * as React from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthData } from '@/lib/supabase';

export const useLoginSubmit = () => {
  // Version robuste de la fonction de connexion avec gestion des erreurs réseau
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
      
      // Suppression explicite des jetons potentiellement obsolètes qui pourraient causer des conflits
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.log("Erreur lors de la déconnexion préalable ignorée");
      }
      
      // Vérifier si le réseau est disponible
      if (!navigator.onLine) {
        throw new Error("Erreur de connexion réseau. Vérifiez votre connexion Internet.");
      }
      
      // Court délai pour assurer que le nettoyage est effectif
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Tentative de connexion pour:", email);
      
      // Tentative de connexion avec des options optimisées pour la fiabilité
      // et un timeout plus long pour éviter les erreurs de réseau
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        }),
        new Promise<{data: null, error: Error}>((_, reject) => 
          setTimeout(() => reject(new Error("Délai d'attente dépassé. Veuillez réessayer.")), 15000)
        )
      ]) as any;
      
      if (error) {
        console.error("Erreur d'authentification:", error.message);
        throw error;
      }

      if (!data.session) {
        console.error("Pas de session retournée");
        throw new Error("Erreur de connexion: Aucune session n'a été créée");
      }
      
      console.log("Connexion réussie, session active");
      
      // Sauvegarder l'email pour la prochaine connexion
      localStorage.setItem('last_logged_in_email', email);
      
      // Notification de succès
      toast({
        title: "Connexion réussie",
        description: "Redirection vers votre tableau de bord...",
      });
      
      // Redirection complète avec rafraîchissement - délai augmenté pour assurer la propagation
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
      
    } catch (error: any) {
      console.error("Erreur d'authentification complète:", error);
      
      // Messages d'erreur plus précis selon le type d'erreur
      let errorMessage = "Email ou mot de passe incorrect.";
      
      if (error.message?.includes("fetch") || error.message?.includes("network") || !navigator.onLine) {
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
