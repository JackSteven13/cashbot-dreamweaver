
import { useEffect, useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface SubscriptionSynchronizerProps {
  onSync?: (subscription: string) => void;
  forceCheck?: boolean;
}

/**
 * Composant invisible qui synchronise l'abonnement entre Supabase et le localStorage
 * avec une option pour forcer la vérification
 */
const SubscriptionSynchronizer = ({ onSync, forceCheck = false }: SubscriptionSynchronizerProps) => {
  const [lastChecked, setLastChecked] = useState(0);
  
  // Fonction de synchronisation extraite pour pouvoir l'utiliser dans le cleanup
  const syncSubscription = useCallback(async (force: boolean = false) => {
    try {
      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("Pas de session active, synchronisation ignorée");
        return;
      }
      
      // Déterminer si on doit forcer une synchronisation
      const now = Date.now();
      const shouldForceSync = force || forceCheck || (now - lastChecked > 10000); // 10 secondes
      
      if (!shouldForceSync && !forceCheck) {
        return;
      }
      
      setLastChecked(now);
      console.log("Synchronisation de l'abonnement depuis Supabase...");
      
      // Essayer d'abord avec une requête directe pour éviter les problèmes de cache
      const { data: userData, error: directError } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', session.user.id)
        .single();
          
      if (!directError && userData && userData.subscription) {
        const currentLocalSub = localStorage.getItem('subscription');
        if (currentLocalSub !== userData.subscription) {
          console.log(`Mise à jour directe de l'abonnement: ${currentLocalSub} -> ${userData.subscription}`);
          localStorage.setItem('subscription', userData.subscription);
          
          if (onSync) {
            onSync(userData.subscription);
          }
          
          // Notification seulement si l'abonnement change d'un niveau non freemium à un autre
          if (currentLocalSub && currentLocalSub !== 'freemium' && currentLocalSub !== userData.subscription) {
            toast({
              title: "Abonnement mis à jour",
              description: `Votre abonnement est maintenant: ${userData.subscription === 'alpha' ? 'Alpha Premium' : userData.subscription.charAt(0).toUpperCase() + userData.subscription.slice(1)}`,
            });
          }
        } else {
          console.log("Abonnement déjà synchronisé:", userData.subscription);
        }
      } else {
        console.error("Erreur lors de la récupération directe:", directError);
        
        // Fallback sur la fonction RPC avec options pour désactiver le cache
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_current_subscription', { 
            user_id: session.user.id 
          }, { 
            head: false, // Désactiver le cache
            count: 'exact' as const
          }) as { data: string | null, error: any };
          
        if (!rpcError && rpcData) {
          // Vérifier si l'abonnement a changé
          const currentLocalSub = localStorage.getItem('subscription');
          if (currentLocalSub !== rpcData) {
            console.log(`Mise à jour de l'abonnement via RPC: ${currentLocalSub} -> ${rpcData}`);
            localStorage.setItem('subscription', rpcData);
            
            if (onSync) {
              onSync(rpcData);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erreur de synchronisation:", error);
    }
  }, [onSync, forceCheck, lastChecked]);
  
  useEffect(() => {
    // Synchroniser immédiatement au montage
    syncSubscription(true);
    
    // Configurer un intervalle pour synchroniser périodiquement
    const intervalId = setInterval(() => syncSubscription(), 15000); // Vérifier toutes les 15 secondes
    
    // Ajouter un event listener pour les changements de focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Re-synchroniser quand l'utilisateur revient sur la page
        syncSubscription(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncSubscription]);
  
  // Composant invisible
  return null;
};

export default SubscriptionSynchronizer;
