
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
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
    setIsLoading(true);
    
    try {
      console.log("Nettoyage préventif des données d'authentification...");
      clearStoredAuthData();
      
      // Petit délai pour s'assurer que le nettoyage est terminé
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("Tentative de connexion avec email:", email);
      
      // Version améliorée de l'authentification avec options explicites pour meilleure compatibilité
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (error) {
        console.error("Erreur d'authentification Supabase:", error);
        throw new Error(error.message || "Erreur de connexion");
      }
      
      if (!data || !data.user || !data.session) {
        console.error("Données d'authentification incomplètes");
        throw new Error("Données d'authentification incomplètes");
      }
      
      console.log("Connexion réussie pour:", data.user.email);
      console.log("Informations de session:", {
        expiresAt: data.session.expires_at,
        userId: data.session.user.id
      });
      
      // Vérifier explicitement que la session est stockée
      const storedSession = localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      if (!storedSession) {
        console.warn("Session non trouvée dans localStorage après connexion, tentative de correction");
        
        // Attendre un peu et vérifier à nouveau
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryStoredSession = localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
        
        if (!retryStoredSession) {
          console.error("Impossible de confirmer le stockage de la session");
        } else {
          console.log("Session trouvée après délai");
        }
      } else {
        console.log("Session bien stockée dans localStorage");
      }
      
      // Enregistrer l'email pour la prochaine connexion
      localStorage.setItem('last_logged_in_email', email);
      
      // Toast de réussite
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${data.user.user_metadata?.full_name || ''}!`,
      });
      
      // Délai plus long pour s'assurer que tout est bien configuré avant la redirection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirection vers le tableau de bord avec remplacement de l'historique
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
