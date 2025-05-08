
import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';
import { clearStoredAuthData, supabase, checkSupabaseConnectivity } from "@/integrations/supabase/client";

const Login = () => {
  const { lastLoggedInEmail } = useLoginSession();
  const [connectivityChecked, setConnectivityChecked] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [connectivityDetails, setConnectivityDetails] = useState<string | null>(null);
  const cleanupDone = useRef(false);

  // Nettoyage radical des données d'authentification au chargement de la page
  // et vérification de connectivité
  useEffect(() => {    
    const initAuth = async () => {
      if (cleanupDone.current) return;
      cleanupDone.current = true;
      
      console.log("Initialisation de l'authentification...");
      
      // Nettoyage complet des données d'authentification
      clearStoredAuthData();
      
      // Tentative de déconnexion pour s'assurer d'un état propre
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log("Déconnexion effectuée avec succès");
        
        // Second nettoyage après la déconnexion pour être certain
        clearStoredAuthData();
        
        // Vérifier si l'URL contient un token ou hash d'authentification
        const hasAuthParams = window.location.hash.includes('access_token') || 
                              window.location.hash.includes('error_code') ||
                              window.location.search.includes('error_code');
                              
        // Nettoyer l'URL si elle contient des paramètres d'authentification
        if (hasAuthParams) {
          window.history.replaceState(null, document.title, window.location.pathname);
        }
        
        // Vérification DNS avec résolution de noms et test de connectivité
        const verifySupabaseConnection = async () => {
          try {
            // Vérification si le DNS résout correctement
            const dnsTestStart = performance.now();
            const checkDNS = await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/rest/v1/', {
              method: 'HEAD',
              headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4'
              },
              mode: 'cors',
              cache: 'no-cache',
            }).catch(() => null);
            const dnsTestTime = Math.round(performance.now() - dnsTestStart);
            
            // Vérifier la connectivité avec Supabase avec système de retry
            let retryCount = 0;
            const maxRetries = 3;
            let connected = false;
            let details = `DNS resolution ${checkDNS ? 'OK' : 'Failed'} (${dnsTestTime}ms)`;
            
            while (retryCount < maxRetries && !connected) {
              console.log(`Vérification de la connectivité Supabase (tentative ${retryCount + 1}/${maxRetries})...`);
              connected = await checkSupabaseConnectivity();
              
              if (!connected && retryCount < maxRetries - 1) {
                details += `\nTentative ${retryCount + 1}: Échec`;
                console.log("Échec de connexion, nouvelle tentative dans 1s...");
                await new Promise(resolve => setTimeout(resolve, 1000));
              } else if (connected) {
                details += `\nTentative ${retryCount + 1}: Succès`;
              } else {
                details += `\nTentative ${retryCount + 1}: Échec final`;
              }
              
              retryCount++;
            }
            
            setIsConnected(connected);
            setConnectivityChecked(true);
            setConnectivityDetails(details);
            
            if (!connected) {
              console.error("Problème persistant de connectivité avec Supabase détecté");
            } else {
              console.log("Connexion à Supabase établie avec succès");
            }
          } catch (error) {
            console.error("Erreur lors de la vérification DNS:", error);
            setConnectivityDetails(`Erreur de vérification: ${(error as Error).message}`);
            setIsConnected(false);
            setConnectivityChecked(true);
          }
        };
        
        // Exécuter la vérification
        await verifySupabaseConnection();
        
      } catch (err) {
        console.log("Erreur lors de l'initialisation:", err);
        setIsConnected(false); 
        setConnectivityChecked(true);
        setConnectivityDetails(`Erreur d'initialisation: ${(err as Error).message}`);
      }
    };
    
    initAuth();
    
    // S'assurer que le HTML a bien le mode sombre appliqué
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-28 pb-12">
        {!connectivityChecked ? (
          <div className="text-center">
            <p className="text-lg mb-4">Vérification de la connectivité au serveur...</p>
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : isConnected ? (
          <LoginContainer lastLoggedInEmail={lastLoggedInEmail} />
        ) : (
          <div className="bg-red-950/30 border border-red-700/50 p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold text-red-200 mb-4">Problème de connexion au serveur</h2>
            <p className="text-red-100 mb-4">
              Impossible d'établir une connexion avec le serveur Supabase. Veuillez vérifier votre connexion internet et réessayer.
            </p>
            {connectivityDetails && (
              <div className="mt-4 p-3 bg-black/30 rounded text-xs font-mono whitespace-pre text-gray-300">
                {connectivityDetails}
              </div>
            )}
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-700 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Login;
