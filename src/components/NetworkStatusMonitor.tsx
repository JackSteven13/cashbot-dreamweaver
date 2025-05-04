
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const NetworkStatusMonitor = () => {
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Vérifier le statut initial de la connexion
    if (!navigator.onLine) {
      setWasOffline(true);
      toast.error('Vous êtes actuellement hors ligne', {
        description: 'Vérifiez votre connexion internet pour continuer.',
        duration: 5000,
      });
    }

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
        } catch (e) {
          console.error("Erreur lors du rafraîchissement de la session après reconnexion:", e);
        }
      }
      setWasOffline(false);
    };

    // Ajouter les écouteurs d'événements
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Nettoyer les écouteurs lors du démontage
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [wasOffline]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default NetworkStatusMonitor;
