
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
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
    
    if (setIsLoading) {
      setIsLoading(true);
    }
    
    // Nettoyer complètement les données d'authentification stockées
    clearStoredAuthData();
    
    try {
      // Vérifier la connexion réseau de façon simple
      if (!navigator.onLine) {
        throw new Error("Vous semblez être hors ligne. Vérifiez votre connexion internet.");
      }
      
      console.log("Tentative de connexion pour:", email);
      
      // Variable pour suivre les tentatives
      let attemptCount = 0;
      let maxAttempts = 3;
      let authResult;
      let lastError = null;
      
      do {
        attemptCount++;
        console.log(`Tentative d'authentification ${attemptCount}/${maxAttempts}...`);
        
        try {
          // Version ultra simplifiée - sans options complexes qui peuvent causer des erreurs
          authResult = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (!authResult.error) break;
          lastError = authResult.error;
          
          // Attendre brièvement entre les tentatives avec délai exponentiel
          if (attemptCount < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(1.5, attemptCount)));
          }
        } catch (err) {
          console.error("Erreur lors de la tentative d'authentification:", err);
          lastError = err;
          
          // Attendre brièvement entre les tentatives avec délai exponentiel
          if (attemptCount < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(1.5, attemptCount)));
          }
        }
      } while (attemptCount < maxAttempts && (!authResult || authResult.error));
      
      // Si nous avons toujours une erreur après toutes les tentatives
      if (lastError || (authResult && authResult.error)) {
        throw lastError || authResult.error;
      }
      
      if (authResult?.data && authResult.data.user) {
        // Sauvegarder l'email pour les futures suggestions
        localStorage.setItem('last_logged_in_email', email);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${authResult.data.user.user_metadata?.full_name || authResult.data.user.email?.split('@')[0] || 'utilisateur'}!`,
        });
        
        // Redirection directe vers le dashboard sans options supplémentaires
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error("Échec de connexion: aucune donnée utilisateur retournée");
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      
      // Gestion des erreurs réseau
      if (!navigator.onLine || 
          error.message?.includes('network') || 
          error.message?.includes('réseau') ||
          error.message?.includes('fetch') ||
          error.message?.includes('Failed to fetch') ||
          error.message?.includes("Délai d'attente dépassé")) {
        toast({
          title: "Problème de connexion réseau",
          description: "Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.",
          variant: "destructive",
          action: <ToastAction altText="Réessayer" onClick={() => window.location.reload()}>
            Réessayer
          </ToastAction>
        });
      } else if (error.message === "Invalid login credentials" || error.message?.includes("credentials")) {
        toast({
          title: "Identifiants incorrects",
          description: "Email ou mot de passe incorrect",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter. Veuillez réessayer.",
          variant: "destructive",
          action: <ToastAction altText="Réessayer" onClick={() => window.location.reload()}>
            Réessayer
          </ToastAction>
        });
      }
      
      if (setIsLoading) {
        setIsLoading(false);
      }
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
