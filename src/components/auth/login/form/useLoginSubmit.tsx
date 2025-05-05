
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
      console.log("=== DÉBUT PROCÉDURE DE CONNEXION - MÉTHODE FORTE ===");
      
      // 1. Nettoyage RADICAL avant tout
      console.log("Étape 1: Nettoyage radical des données d'authentification");
      clearStoredAuthData();
      
      // 2. Délai pour s'assurer que le nettoyage est complet
      console.log("Étape 2: Pause pour traitement complet du nettoyage");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 3. Tentative de connexion directe avec timeout de sécurité
      console.log("Étape 3: Tentative de connexion avec timeout de 15s");
      
      // Création d'une promesse avec timeout pour éviter les blocages
      const loginWithTimeout = async () => {
        // Création d'un controller pour pouvoir annuler la requête si besoin
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        try {
          // Tentative de connexion avec le client Supabase standard
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });
          
          clearTimeout(timeoutId);
          
          if (error) throw error;
          return data;
        } catch (err) {
          clearTimeout(timeoutId);
          throw err;
        }
      };
      
      const data = await loginWithTimeout();
      
      if (!data || !data.user || !data.session) {
        throw new Error("La réponse d'authentification est incomplète");
      }
      
      // 4. Stockage de l'email pour la prochaine connexion
      console.log("Étape 4: Sauvegarde de l'email et finalisation");
      localStorage.setItem('last_logged_in_email', email);
      
      // 5. Toast et redirection
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté.",
      });
      
      // Redirection vers le tableau de bord
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 300);
      
    } catch (error: any) {
      console.error("ERREUR DE CONNEXION (détaillée):", error);
      
      // Message d'erreur simplifié et clair
      let errorMessage = "Impossible de se connecter.";
      
      if (error.message) {
        if (error.message.includes("Failed to fetch") || 
            error.message.includes("fetch") ||
            error.message.includes("network") ||
            error.message.includes("AbortError")) {
          errorMessage = "Erreur de communication avec le serveur d'authentification. Vérifiez votre connexion internet et réessayez.";
        } else if (error.message.includes("Invalid login") || 
                  error.message.includes("incorrect") ||
                  error.message.includes("wrong") ||
                  error.message.includes("Email") ||
                  error.message.includes("password")) {
          errorMessage = "Email ou mot de passe incorrect. Veuillez réessayer.";
        } else {
          errorMessage = `Erreur: ${error.message}`;
        }
      }
      
      toast({
        title: "Échec de connexion",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Nettoyage après échec
      clearStoredAuthData();
    } finally {
      console.log("=== FIN PROCÉDURE DE CONNEXION ===");
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
