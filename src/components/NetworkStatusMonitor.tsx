
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { checkDirectConnectivity } from '@/utils/auth/directApiCalls';

export const NetworkStatusMonitor = () => {
  const [wasOffline, setWasOffline] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Fonction pour vérifier activement la connectivité avec Supabase
  const checkSupabaseConnectivity = useCallback(async () => {
    if (isCheckingConnection) return;
    
    setIsCheckingConnection(true);
    try {
      // Vérifier d'abord si le navigateur est en ligne
      if (!navigator.onLine) {
        setWasOffline(true);
        toast.error('Vous êtes actuellement hors ligne', {
          description: 'Vérifiez votre connexion internet pour continuer.',
          duration: 5000,
        });
        return;
      }
      
      // Vérifier la connectivité directe avec Supabase
      const isDirectConnectivityOk = await checkDirectConnectivity();
      
      if (!isDirectConnectivityOk) {
        console.warn("Connectivité directe avec Supabase impossible");
        toast.warning('Connexion limitée au serveur', {
          description: 'Certaines fonctionnalités pourraient être indisponibles.',
          duration: 5000,
        });
      }
    } catch (e) {
      console.error("Erreur lors de la vérification de connectivité:", e);
    } finally {
      setIsCheckingConnection(false);
    }
  }, [isCheckingConnection]);

  useEffect(() => {
    // Vérifier le statut initial de la connexion et la connectivité avec Supabase
    checkSupabaseConnectivity();
    
    // Gestionnaire pour la perte de connexion
    const handleOffline = () => {
      setWasOffline(true);
      toast.error('Connexion internet perdue', {
        description: 'Vérifiez votre connexion pour continuer à utiliser l\'application.',
        duration: 5000,
      });
    };

    // Gestionnaire pour le retour de la connexion
    const handleOnline = async () => {
      if (wasOffline) {
        toast.success('Connexion internet rétablie', {
          description: 'Vous êtes à nouveau connecté.',
          duration: 3000,
        });
        
        // Essayer de rafraîchir la session Supabase
        try {
          await supabase.auth.refreshSession();
          console.log("Session rafraîchie après reconnexion");
          
          // Vérifier la connectivité avec Supabase
          setTimeout(() => {
            checkSupabaseConnectivity();
          }, 2000);
        } catch (e) {
          console.error("Erreur lors du rafraîchissement de la session après reconnexion:", e);
        }
      }
      setWasOffline(false);
    };

    // Ajouter les écouteurs d'événements
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Configuration d'une vérification périodique de la connexion
    const connectionCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        checkSupabaseConnectivity();
      }
    }, 60000); // Vérifier toutes les minutes

    // Nettoyer les écouteurs lors du démontage
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearInterval(connectionCheckInterval);
    };
  }, [wasOffline, checkSupabaseConnectivity]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default NetworkStatusMonitor;
