
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearAuthData } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();
  const [connectionChecked, setConnectionChecked] = useState(false);
  
  // Vérifier la connexion réseau au chargement
  useEffect(() => {
    const checkConnectionAndNotify = async () => {
      // Vérifier si nous sommes en ligne
      if (!navigator.onLine) {
        toast({
          title: "Problème de connexion",
          description: "Vérifiez votre connexion Internet pour pouvoir vous connecter",
          variant: "destructive",
          duration: 5000
        });
        setConnectionChecked(true);
        return;
      }
      
      // Test de connectivité réseau vers Supabase
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co', {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        setConnectionChecked(true);
      } catch (err) {
        console.error("Erreur de connexion au test de réseau:", err);
        toast({
          title: "Problème de connexion",
          description: "Le service d'authentification semble inaccessible. Vérifiez votre connexion.",
          variant: "destructive",
          duration: 6000
        });
        setConnectionChecked(true);
      }
    };
    
    checkConnectionAndNotify();
  }, []);
  
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
