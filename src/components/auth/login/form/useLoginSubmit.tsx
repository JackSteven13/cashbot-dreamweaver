
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
      
      // Utiliser la méthode signInWithPassword avec des options de base
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error);
        
        // Message d'erreur simplifié
        toast({
          title: "Échec de connexion",
          description: "Email ou mot de passe incorrect.",
          variant: "destructive"
        });
        
        // Nettoyage après échec
        clearStoredAuthData();
        setIsLoading(false);
        return;
      }
      
      // Vérifier la présence d'une session après connexion
      if (data.session && data.user) {
        console.log("Connexion réussie pour:", email);
        
        // Enregistrer l'email pour la prochaine connexion
        localStorage.setItem('last_logged_in_email', email);
        
        // Afficher un toast de réussite
        toast({
          title: "Connexion réussie",
          description: "Redirection vers votre tableau de bord...",
        });
        
        // Petit délai pour permettre au toast d'être visible
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Redirection vers le tableau de bord avec rafraîchissement complet
        window.location.href = '/dashboard';
      } else {
        console.error("Pas de session après connexion réussie");
        throw new Error("Échec de création de session");
      }
    } catch (error) {
      console.error("Erreur complète:", error);
      
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
