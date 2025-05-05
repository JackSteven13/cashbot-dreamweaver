
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearStoredAuthData, supabase } from "@/integrations/supabase/client";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();

  // Nettoyage ultra-radical au chargement de la page
  useEffect(() => {
    console.log("🔄 Page Login: Nettoyage ultra-radical au chargement");
    
    // 1. Déconnexion explicite - première étape
    const performSignOut = async () => {
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.error("Erreur lors de la déconnexion:", err);
      }
    };
    
    performSignOut();
    
    // 2. Premier nettoyage immédiat
    clearStoredAuthData();
    
    // 3. Second nettoyage après un court délai
    const timer1 = setTimeout(clearStoredAuthData, 300);
    
    // 4. Troisième nettoyage pour s'assurer que tout est bien propre
    const timer2 = setTimeout(clearStoredAuthData, 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
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
