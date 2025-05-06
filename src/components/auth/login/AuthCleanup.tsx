
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthData } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

const AuthCleanup = () => {
  const cleanupDone = useRef(false);
  const [networkFailed, setNetworkFailed] = useState(false);
  const cleanupAttempts = useRef(0);
  
  // Fonction pour vérifier la connectivité de façon robuste
  const checkConnection = async () => {
    try {
      if (!navigator.onLine) {
        console.log("Le navigateur rapporte être hors ligne");
        return false;
      }
      
      // Méthode 1: Vérification direct de l'API Supabase
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/auth/v1/cookie', {
          method: 'GET',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        return true;
      } catch (e) {
        console.log("Échec de la première méthode de vérification");
      }
      
      // Méthode 2: Essayer une requête à différents domaines de fallback
      const fallbackUrls = ['https://www.google.com', 'https://www.cloudflare.com'];
      
      for (const url of fallbackUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal,
            cache: 'no-store'
          });
          
          clearTimeout(timeoutId);
          console.log(`Connexion établie via ${url}`);
          return true;
        } catch (e) {
          console.log(`Échec de connexion à ${url}`);
        }
      }
      
      // Si on arrive ici, toutes les vérifications ont échoué
      console.error("Toutes les méthodes de vérification de connectivité ont échoué");
      return false;
    } catch (e) {
      console.error("Erreur lors de la vérification de connectivité:", e);
      return navigator.onLine; // Fallback sur l'état du navigateur
    }
  };
  
  // Nettoyer les données d'authentification de façon agressive
  useEffect(() => {
    if (cleanupDone.current) return;
    
    const performCleanup = async () => {
      console.log("🧹 AuthCleanup: Nettoyage agressif des données d'authentification");
      cleanupAttempts.current++;
      
      if (cleanupAttempts.current > 3) {
        cleanupDone.current = true;
        console.log("Nombre maximum de tentatives de nettoyage atteint");
        return;
      }
      
      // Vérifier la connectivité réseau
      const isNetworkOk = await checkConnection();
      if (!isNetworkOk && cleanupAttempts.current === 1) {
        setNetworkFailed(true);
        console.log("⚠️ Problème de connectivité réseau détecté");
        toast({
          title: "Problème de connexion",
          description: "Vérifiez votre connexion Internet",
          variant: "destructive"
        });
      }
      
      // Premier nettoyage complet
      clearAuthData();
      
      try {
        // Déconnexion explicite avec plusieurs méthodes pour s'assurer du nettoyage
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.log("Erreur de déconnexion ignorée:", e);
        }
        
        // Nettoyage supplémentaire de tous les cookies liés à l'authentification
        document.cookie.split(';').forEach(c => {
          const cookieName = c.trim().split('=')[0];
          if (cookieName.includes('sb-') || cookieName.includes('supabase') || cookieName.includes('auth')) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
      } catch (e) {
        console.error("Erreur lors du nettoyage avancé:", e);
      }
      
      // Petit délai pour s'assurer que toutes les opérations asynchrones sont terminées
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Second nettoyage pour s'assurer que tout est propre
      clearAuthData();
      
      // Marquer comme terminé
      cleanupDone.current = true;
      
      console.log("🧹 AuthCleanup: Nettoyage terminé");
    };
    
    performCleanup();
    
    // Nettoyage au démontage pour éviter les fuites mémoire
    return () => {
      cleanupDone.current = true;
    };
  }, []);

  // Afficher une alerte si le réseau est inaccessible
  if (networkFailed) {
    return (
      <div className="hidden">
        {/* Composant invisible, l'alerte est gérée via toast */}
      </div>
    );
  }

  return null; // Composant sans rendu visuel
};

export default AuthCleanup;
