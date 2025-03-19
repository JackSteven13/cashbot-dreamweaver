
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionSynchronizerProps {
  onSync?: (subscription: string) => void;
}

/**
 * Composant invisible qui synchronise l'abonnement entre Supabase et le localStorage
 */
const SubscriptionSynchronizer = ({ onSync }: SubscriptionSynchronizerProps) => {
  useEffect(() => {
    const syncSubscription = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("Pas de session active, synchronisation ignorée");
          return;
        }
        
        console.log("Synchronisation de l'abonnement depuis Supabase...");
        
        // Essayer d'abord la fonction RPC pour une récupération fiable
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_current_subscription', { 
            user_id: session.user.id 
          }) as { data: string | null, error: any };
          
        if (!rpcError && rpcData) {
          // Vérifier si l'abonnement a changé
          const currentLocalSub = localStorage.getItem('subscription');
          if (currentLocalSub !== rpcData) {
            console.log(`Mise à jour de l'abonnement: ${currentLocalSub} -> ${rpcData}`);
            localStorage.setItem('subscription', rpcData);
            
            if (onSync) {
              onSync(rpcData);
            }
          } else {
            console.log("Abonnement déjà synchronisé:", rpcData);
          }
        } else {
          // Fallback sur requête directe
          console.log("Échec RPC, tentative directe:", rpcError);
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
            }
          }
        }
      } catch (error) {
        console.error("Erreur de synchronisation:", error);
      }
    };
    
    // Synchroniser immédiatement au montage
    syncSubscription();
    
    // Configurer un intervalle pour synchroniser périodiquement
    const intervalId = setInterval(syncSubscription, 60000); // Vérifier toutes les minutes
    
    return () => clearInterval(intervalId);
  }, [onSync]);
  
  // Composant invisible
  return null;
};

export default SubscriptionSynchronizer;
