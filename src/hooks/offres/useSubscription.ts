
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const useSubscription = () => {
  const [currentSubscription, setCurrentSubscription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        setIsLoading(true);
        
        // Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Désactiver complètement le cache pour cette requête critique
          const options = { 
            head: false,
            count: 'exact' as const
          };
          
          try {
            // 1. Essayer d'abord la fonction RPC pour une réponse plus fiable
            const { data: rpcData, error: rpcError } = await supabase
              .rpc('get_current_subscription', { 
                user_id: session.user.id 
              }, options) as { data: string | null, error: any };
              
            if (!rpcError && rpcData) {
              console.log("Abonnement récupéré via RPC:", rpcData);
              setCurrentSubscription(rpcData);
              localStorage.setItem('subscription', rpcData);
            } else {
              // 2. Si RPC échoue, requête directe avec contournement du cache
              console.log("Échec RPC, tentative directe:", rpcError);
              const { data: userData, error: directError } = await supabase
                .from('user_balances')
                .select('subscription')
                .eq('id', session.user.id)
                .single();
                
              if (!directError && userData) {
                console.log("Abonnement récupéré directement:", userData.subscription);
                setCurrentSubscription(userData.subscription);
                // Synchroniser le localStorage
                localStorage.setItem('subscription', userData.subscription);
              } else {
                // Fallback sur localStorage en cas d'erreur, mais avec vérification de validité
                console.log("Erreur de requête directe:", directError);
                const localSub = localStorage.getItem('subscription');
                if (localSub && ['freemium', 'starter', 'gold', 'elite'].includes(localSub)) {
                  console.log("Utilisation de l'abonnement du localStorage:", localSub);
                  setCurrentSubscription(localSub);
                } else {
                  // Si aucune donnée valide n'est disponible, utiliser 'freemium' par défaut
                  console.log("Aucune donnée valide, utilisation de freemium par défaut");
                  setCurrentSubscription('freemium');
                }
                
                // Notification en cas d'erreur
                if (directError && directError.code !== 'PGRST116') {
                  toast({
                    title: "Problème de connexion",
                    description: "Impossible de vérifier votre abonnement. Les données affichées peuvent ne pas être à jour.",
                    variant: "destructive"
                  });
                }
              }
            }
          } catch (error) {
            console.error("Erreur complète lors de la vérification de l'abonnement:", error);
            // Fallback sur localStorage avec vérification
            const localSub = localStorage.getItem('subscription');
            if (localSub && ['freemium', 'starter', 'gold', 'elite'].includes(localSub)) {
              setCurrentSubscription(localSub);
            } else {
              setCurrentSubscription('freemium');
            }
          }
        } else {
          // Si pas de session, utiliser 'freemium'
          console.log("Pas de session active, utilisation de freemium par défaut");
          setCurrentSubscription('freemium');
        }
      } catch (error) {
        console.error("Erreur globale:", error);
        setCurrentSubscription('freemium');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Vérifier l'abonnement au chargement
    checkSubscription();
    
    // Mettre en place un listener pour les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log("État d'authentification modifié, actualisation de l'abonnement");
        checkSubscription();
      }
    });
    
    // Écouter les changements d'abonnement via le localStorage
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'subscription' && event.newValue) {
        console.log("Mise à jour de l'abonnement via localStorage:", event.newValue);
        setCurrentSubscription(event.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return { currentSubscription, isLoading };
};
