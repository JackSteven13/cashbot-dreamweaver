
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, pingSupabaseServer } from "@/integrations/supabase/client";

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
      
      // Vérifier d'abord la connectivité au serveur Supabase
      const isServerReachable = await pingSupabaseServer();
      if (!isServerReachable) {
        toast({
          title: "Serveur inaccessible",
          description: "Impossible de contacter le serveur d'authentification. Veuillez réessayer ultérieurement.",
          variant: "destructive"
        });
        
        setIsLoading(false);
        return;
      }
      
      // Tentative de connexion avec timeout
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        new Promise<any>(resolve => setTimeout(() => 
          resolve({ error: { message: "Délai d'attente dépassé" } }), 10000))
      ]);
      
      if (error) {
        console.error("Erreur d'authentification:", error);
        
        toast({
          title: "Échec de connexion",
          description: "Email ou mot de passe incorrect.",
          variant: "destructive"
        });
        
        setIsLoading(false);
        return;
      }
      
      // Vérifier la présence d'une session après connexion
      if (data.session && data.user) {
        console.log("Connexion réussie pour:", email);
        
        // Enregistrer l'email pour la prochaine connexion
        localStorage.setItem('last_logged_in_email', email);
        
        // Redirection vers le tableau de bord avec un rechargement complet
        window.location.href = '/dashboard';
      } else {
        console.error("Pas de session après connexion réussie");
        
        toast({
          title: "Erreur de session",
          description: "Impossible de créer une session. Veuillez réessayer.",
          variant: "destructive"
        });
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erreur complète:", error);
      
      toast({
        title: "Échec de connexion",
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
        variant: "destructive"
      });
      
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;
