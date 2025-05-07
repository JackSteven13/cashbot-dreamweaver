
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearStoredAuthData, supabase } from "@/integrations/supabase/client";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage initial des données d'authentification au chargement de la page
  useEffect(() => {    
    // Nettoyage complet des données d'authentification
    clearStoredAuthData();
    
    // Tentative de déconnexion globale pour s'assurer d'un état propre
    try {
      const handleSignOut = async () => {
        await supabase.auth.signOut({ scope: 'global' });
      };
      handleSignOut();
    } catch (err) {
      // Ignorer les erreurs, le nettoyage localStorage est suffisant
      console.log("Erreur lors de la déconnexion, ignorée:", err);
    }
    
    // Vérifier l'accessibilité du serveur Supabase
    const checkServerStatus = async () => {
      try {
        // Effectuer une requête HEAD pour vérifier si le serveur répond
        await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/auth/v1/health', {
          method: 'HEAD',
          headers: { 
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4'
          },
          cache: 'no-store'
        });
        console.log("Serveur Supabase accessible");
      } catch (error) {
        console.error("Serveur Supabase inaccessible:", error);
      }
    };
    
    // Vérifier le statut du serveur au chargement
    checkServerStatus();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-28 pb-12">
        <LoginContainer lastLoggedInEmail={lastLoggedInEmail} />
      </main>
    </div>
  );
};

export default Login;
