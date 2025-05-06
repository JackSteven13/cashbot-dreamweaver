
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearAuthData } from '@/lib/supabase';

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();
  
  // Nettoyage complet au chargement de la page de login
  useEffect(() => {    
    const cleanupAuth = async () => {
      try {
        console.log("Nettoyage des données d'authentification");
        
        // Premier nettoyage immédiat
        clearAuthData();
        
        // Deuxième nettoyage après un délai
        setTimeout(clearAuthData, 500);
        
        // Troisième nettoyage pour être absolument certain
        setTimeout(clearAuthData, 1500);
        
        console.log("Nettoyage terminé");
      } catch (err) {
        console.error("Erreur lors du nettoyage:", err);
      }
    };
    
    cleanupAuth();
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
