import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase, clearStoredAuthData, checkNetworkConnectivity } from "@/lib/supabase";

export const useLoginSubmit = () => {
  const navigate = useNavigate();
  const [networkError, setNetworkError] = React.useState(false);

  // Vérification périodique de la connectivité
  React.useEffect(() => {
    const checkConnectivity = async () => {
      const isConnected = await checkNetworkConnectivity();
      setNetworkError(!isConnected);
    };
    
    // Vérifier immédiatement
    checkConnectivity();
    
    // Vérifier toutes les 5 secondes
    const interval = setInterval(checkConnectivity, 5000);
    return () => clearInterval(interval);
  }, []);

  const logConnection = async (email: string, success: boolean, error_message: string | null = null, user_id: string | null = null) => {
    try {
      console.log("Tentative d'enregistrement de connexion:", { email, success });
      
      // Utiliser fetch directement sans passer par le client Supabase
      const response = await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/functions/v1/log-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          success: success,
          error_message: error_message,
          user_id: user_id
        }),
        // Augmenter le timeout et activer keep-alive pour être plus robuste
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.error("Échec de l'enregistrement de connexion:", await response.text());
      } else {
        console.log("Connexion enregistrée avec succès");
      }
    } catch (logErr) {
      console.error("Exception lors de l'enregistrement de connexion:", logErr);
      // Erreur non fatale, continuer avec le processus de connexion
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    email: string,
    password: string,
    setIsLoading: (isLoading: boolean) => void
  ) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Vérifier la connectivité avant de tenter la connexion
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      toast({
        title: "Problème de connexion",
        description: "Impossible de contacter le serveur. Vérifiez votre connexion internet.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("Tentative de connexion pour:", email);
      
      // Nettoyer les données d'auth existantes
      clearStoredAuthData();
      
      // Attendre un court instant pour s'assurer du nettoyage complet
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Connexion avec des options simplifiées
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error("Erreur d'authentification:", error);
        
        // Log échoué de façon robuste
        await logConnection(email, false, error.message, null);
        
        // Message d'erreur adapté
        toast({
          title: "Échec de connexion",
          description: "Email ou mot de passe incorrect.",
          variant: "destructive"
        });
        
        // Nettoyage après échec
        clearStoredAuthData();
        
        // Sortie en fin de tentative échouée
        setIsLoading(false);
        return;
      }
      
      // Vérifier la présence d'une session après connexion
      if (data.session && data.user) {
        console.log("Connexion réussie pour:", email);
        
        // Enregistrer l'email pour la prochaine connexion
        localStorage.setItem('last_logged_in_email', email);
        
        // Log réussi de façon robuste
        await logConnection(email, true, null, data.user.id);
        
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
      
      // Tenter d'enregistrer l'échec même en cas d'erreur générale
      await logConnection(
        email, 
        false, 
        error instanceof Error ? error.message : "Erreur inconnue", 
        null
      );
      
      // Message d'erreur adapté
      toast({
        title: "Échec de connexion",
        description: networkError ? 
          "Problème de connexion au serveur. Vérifiez votre connexion internet." :
          "Email ou mot de passe incorrect.",
        variant: "destructive"
      });
      
      // Nettoyage après échec
      clearStoredAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit, networkError };
};

export default useLoginSubmit;
