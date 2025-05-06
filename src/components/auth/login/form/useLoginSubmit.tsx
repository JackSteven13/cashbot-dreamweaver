
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
      // Sans vérification réseau préalable, on tente directement la connexion
      console.log("Tentative de connexion avec:", email);
      
      let attemptCount = 0;
      let maxAttempts = 2;
      let authResult;
      let lastError = null;
      
      do {
        attemptCount++;
        
        try {
          // Tentative de connexion sans timeout
          authResult = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (!authResult.error) break;
          lastError = authResult.error;
          
          if (attemptCount < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (err) {
          console.error("Erreur lors de la tentative d'authentification:", err);
          lastError = err;
          
          if (attemptCount < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      } while (attemptCount < maxAttempts && (!authResult || authResult.error));
      
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
        
        // Redirection plus rapide vers le dashboard
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error("Échec de connexion: aucune donnée utilisateur retournée");
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      
      // Simplification de la gestion d'erreurs pour éviter les boucles
      if (error.message === "Invalid login credentials" || error.message?.includes("credentials")) {
        toast({
          title: "Identifiants incorrects",
          description: "Email ou mot de passe incorrect",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter. Veuillez réessayer.",
          variant: "destructive",
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
