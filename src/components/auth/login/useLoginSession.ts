
import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";

export const useLoginSession = () => {
  const [lastLoggedInEmail, setLastLoggedInEmail] = useState<string | null>(null);
  
  useEffect(() => {
    // Récupérer l'email précédemment utilisé
    const savedEmail = localStorage.getItem('last_logged_in_email');
    if (savedEmail) {
      setLastLoggedInEmail(savedEmail);
    }
    
    // Vérifier si une session est déjà active
    const checkActiveSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        // Si une session est active et qu'on est sur la page de login,
        // rediriger vers le dashboard
        if (data.session) {
          console.log("Session active détectée, redirection vers le dashboard");
          window.location.href = '/dashboard';
        }
      } catch (err) {
        console.error("Erreur lors de la vérification de session:", err);
      }
    };
    
    checkActiveSession();
  }, []);

  return { lastLoggedInEmail };
};

export default useLoginSession;
