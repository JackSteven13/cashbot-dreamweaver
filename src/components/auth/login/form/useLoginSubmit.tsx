
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
    
    // Nettoyer les données d'authentification avant la tentative de connexion
    try {
      console.log("Tentative de connexion pour:", email);
      clearStoredAuthData();
      
      // Attendre un court instant pour s'assurer que le nettoyage est effectif
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Essayer la connexion avec un timeout pour éviter les blocages
      const loginPromise = new Promise(async (resolve, reject) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
          });
          
          if (error) {
            console.error("Erreur d'authentification:", error.message);
            reject(error);
            return;
          }
          
          if (!data?.user || !data?.session) {
            reject(new Error("Échec de connexion: aucune donnée utilisateur retournée"));
            return;
          }
          
          resolve(data);
        } catch (error) {
          console.error("Exception lors de la connexion:", error);
          reject(error);
        }
      });
      
      // Ajouter un timeout pour éviter les attentes infinies
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Délai d'attente dépassé")), 10000);
      });
      
      // Utiliser Promise.race pour implémenter un timeout
      const data = await Promise.race([loginPromise, timeoutPromise]);
      
      // Si on arrive ici, c'est que la connexion a réussi
      console.log("Connexion réussie pour l'utilisateur");
      
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
      console.error("Erreur lors de la tentative de connexion:", error);
      
      // Message d'erreur utilisateur plus détaillé
      const errorMessage = error.message && error.message.includes("Invalid login")
        ? "Email ou mot de passe incorrect. Veuillez réessayer."
        : error.message && error.message.includes("timeout") 
          ? "Délai de connexion dépassé. Veuillez réessayer."
          : "Une erreur s'est produite lors de la connexion. Veuillez réessayer.";
      
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
