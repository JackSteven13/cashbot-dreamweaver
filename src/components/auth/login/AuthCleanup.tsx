
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthData } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

const AuthCleanup = () => {
  const cleanupDone = useRef(false);
  const [networkFailed, setNetworkFailed] = useState(false);
  
  // Fonction pour vérifier la connectivité
  const checkConnection = async () => {
    try {
      const response = await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store'
      });
      return true;
    } catch (e) {
      console.error("Erreur de connectivité:", e);
      return false;
    }
  };
  
  // Nettoyer les données d'authentification de façon agressive
  useEffect(() => {
    if (cleanupDone.current) return;
    
    const performCleanup = async () => {
      console.log("🧹 AuthCleanup: Nettoyage agressif des données d'authentification");
      
      // Vérifier la connectivité réseau
      const isNetworkOk = await checkConnection();
      if (!isNetworkOk) {
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
        // Déconnexion explicite d'abord avec des options de sécurité maximales
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.log("Erreur de déconnexion ignorée:", e);
      }
      
      // Petit délai pour s'assurer que toutes les opérations asynchrones sont terminées
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Second nettoyage pour s'assurer que tout est propre
      clearAuthData();
      
      // Troisième nettoyage après un délai plus long pour les opérations différées
      setTimeout(() => {
        if (!cleanupDone.current) {
          clearAuthData();
          cleanupDone.current = true;
        }
      }, 2000);
      
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
