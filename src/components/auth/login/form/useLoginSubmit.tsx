
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData, verifyAuthDataIsClean } from "@/integrations/supabase/client";

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
      console.log("=== DÉBUT DE LA PROCÉDURE DE CONNEXION ===");
      console.log("Email utilisé:", email);
      console.log("Nettoyage des données d'authentification...");
      
      // Premier nettoyage radical
      clearStoredAuthData();
      
      // Vérification que le nettoyage est effectif
      if (!verifyAuthDataIsClean()) {
        console.warn("Le nettoyage n'a pas été complètement effectif, relance...");
        clearStoredAuthData();
      }
      
      // Attendre pour s'assurer que le nettoyage est effectif
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("Tentative de connexion directe...");
      
      // Tentative de connexion avec timeout pour éviter les blocages
      let loginAttempt = null;

      try {
        // Configurer un timeout pour la requête d'authentification
        const loginPromise = supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        
        // Timeout de 12 secondes pour la demande d'authentification
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Délai d'attente dépassé pour l'authentification")), 12000);
        });
        
        // Utiliser Promise.race pour implémenter le timeout
        loginAttempt = await Promise.race([loginPromise, timeoutPromise]) as any;
      } catch (err) {
        console.error("Erreur lors de la tentative de connexion directe:", err);
        throw new Error(`Erreur de communication avec le serveur: ${err.message}`);
      }
      
      // Vérifier les résultats de la tentative de connexion
      if (loginAttempt?.error) {
        console.error("Erreur d'authentification retournée par Supabase:", loginAttempt.error);
        
        if (loginAttempt.error.message.includes("Invalid login")) {
          throw new Error("Email ou mot de passe incorrect");
        } else {
          throw new Error(`Erreur d'authentification: ${loginAttempt.error.message}`);
        }
      }
      
      if (!loginAttempt?.data?.user || !loginAttempt?.data?.session) {
        console.error("Réponse d'authentification incomplète:", loginAttempt);
        throw new Error("La réponse du serveur d'authentification est incomplète");
      }
      
      // Si on arrive ici, c'est que la connexion a réussi
      console.log("Connexion réussie!", loginAttempt.data.user);
      
      // Enregistrer l'email pour une reconnexion ultérieure
      localStorage.setItem('last_logged_in_email', email);
      
      // Afficher un toast de confirmation
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté.",
      });
      
      // Redirection vers le tableau de bord après un court délai
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 300);
      
    } catch (error: any) {
      console.error("Erreur complète lors de la connexion:", error);
      
      // Message d'erreur utilisateur détaillé mais simplifié
      let errorMessage = "Une erreur s'est produite lors de la connexion.";
      
      if (error.message) {
        if (error.message.includes("timeout") || error.message.includes("délai")) {
          errorMessage = "Le serveur d'authentification n'a pas répondu. Veuillez vérifier votre connexion internet et réessayer.";
        } else if (error.message.includes("incorrect") || error.message.includes("Invalid login")) {
          errorMessage = "Email ou mot de passe incorrect. Veuillez réessayer.";
        } else if (error.message.includes("communication") || error.message.includes("network")) {
          errorMessage = "Problème de communication avec le serveur d'authentification. Veuillez réessayer plus tard.";
        } else {
          errorMessage = `Erreur: ${error.message}`;
        }
      }
      
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Nettoyer à nouveau en cas d'échec
      clearStoredAuthData();
    } finally {
      console.log("=== FIN DE LA PROCÉDURE DE CONNEXION ===");
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
