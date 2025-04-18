
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface UseUserDataSyncParams {
  mountedRef: React.RefObject<boolean>;
}

export const useUserDataSync = ({ mountedRef }: UseUserDataSyncParams) => {
  // Function to synchronize data with better stability
  const syncUserData = useCallback(async () => {
    if (!mountedRef.current) return false;
    
    try {
      console.log("Syncing user data after authentication");
      
      // Check if sync is already in progress
      if (localStorage.getItem('data_syncing') === 'true') {
        console.log("Data sync already in progress, waiting");
        await new Promise(resolve => setTimeout(resolve, 600));
        return true;
      }
      
      localStorage.setItem('data_syncing', 'true');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No active session, skipping sync");
        localStorage.removeItem('data_syncing');
        return false;
      }
      
      // Use a more reliable approach to wait for session establishment
      let attempts = 0;
      const maxAttempts = 5; // Augmenté pour plus de fiabilité
      let syncSuccess = false;
      
      while (attempts < maxAttempts && !syncSuccess && mountedRef.current) {
        try {
          // Add progressive delay between attempts
          if (attempts > 0) {
            await new Promise(resolve => setTimeout(resolve, 300 * attempts));
          }
          
          // Récupérer les données utilisateur avec une requête parallèle
          const [userBalanceResult, profileResult] = await Promise.all([
            supabase.from('user_balances').select('subscription, balance, daily_session_count').eq('id', session.user.id).maybeSingle(),
            supabase.from('profiles').select('full_name, email').eq('id', session.user.id).maybeSingle()
          ]);
          
          // Vérifier les résultats et mettre à jour le localStorage
          if (!userBalanceResult.error && userBalanceResult.data) {
            const userData = userBalanceResult.data;
            // Mettre à jour l'abonnement dans localStorage
            if (userData.subscription) {
              localStorage.setItem('subscription', userData.subscription);
              console.log("Abonnement mis à jour:", userData.subscription);
            }
            
            // Mettre à jour le solde dans localStorage
            if (userData.balance !== undefined) {
              localStorage.setItem('currentBalance', String(userData.balance));
              localStorage.setItem('lastKnownBalance', String(userData.balance));
              console.log("Solde mis à jour:", userData.balance);
            }
            
            // Mettre à jour le compteur de sessions quotidiennes
            if (userData.daily_session_count !== undefined) {
              localStorage.setItem('dailySessionCount', String(userData.daily_session_count));
              console.log("Compteur de sessions mis à jour:", userData.daily_session_count);
            }
            
            syncSuccess = true;
          } else if (userBalanceResult.error) {
            console.error("Erreur lors de la récupération du solde:", userBalanceResult.error);
          }
          
          // Récupérer et stocker le nom d'utilisateur
          if (!profileResult.error && profileResult.data && profileResult.data.full_name) {
            localStorage.setItem('lastKnownUsername', profileResult.data.full_name);
            console.log("Nom d'utilisateur mis à jour:", profileResult.data.full_name);
            syncSuccess = true;
            
            // Déclencher un événement pour signaler que le nom est disponible
            window.dispatchEvent(new CustomEvent('username:loaded', { 
              detail: { username: profileResult.data.full_name }
            }));
          } else if (session.user.user_metadata?.full_name) {
            // Fallback sur les métadonnées utilisateur
            localStorage.setItem('lastKnownUsername', session.user.user_metadata.full_name);
            console.log("Nom d'utilisateur récupéré des métadonnées:", session.user.user_metadata.full_name);
            syncSuccess = true;
            
            // Déclencher un événement pour signaler que le nom est disponible
            window.dispatchEvent(new CustomEvent('username:loaded', { 
              detail: { username: session.user.user_metadata.full_name }
            }));
          } else if (profileResult.error) {
            console.error("Erreur lors de la récupération du profil:", profileResult.error);
          }
          
          if (!syncSuccess) {
            attempts++;
            console.log(`Sync attempt ${attempts}/${maxAttempts} incomplete, retrying...`);
          }
        } catch (err) {
          attempts++;
          console.error(`Sync attempt ${attempts}/${maxAttempts} error:`, err);
        }
      }
      
      // Check if a forced refresh was requested
      const forceRefresh = localStorage.getItem('forceRefreshBalance');
      if (forceRefresh === 'true') {
        console.log("Force refresh detected, clearing flag");
        localStorage.removeItem('forceRefreshBalance');
        
        // Déclencher un événement pour forcer la mise à jour de l'interface
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { 
            balance: localStorage.getItem('currentBalance'),
            subscription: localStorage.getItem('subscription') 
          }
        }));
      }
      
      // Si la synchronisation a échoué après plusieurs tentatives
      if (!syncSuccess && attempts >= maxAttempts) {
        console.error("La synchronisation a échoué après plusieurs tentatives");
        
        // Notifier l'utilisateur en cas d'échec
        if (mountedRef.current) {
          toast({
            title: "Synchronisation des données",
            description: "Un problème est survenu lors de la récupération des données. Certaines fonctionnalités pourraient ne pas être disponibles.",
            variant: "destructive",
            duration: 5000
          });
        }
      }
      
      localStorage.removeItem('data_syncing');
      return syncSuccess;
    } catch (error) {
      console.error("Error syncing user data:", error);
      localStorage.removeItem('data_syncing');
      
      // Déclencher un événement pour informer d'une erreur de synchronisation
      window.dispatchEvent(new CustomEvent('user:sync-error', { 
        detail: { error: String(error) }
      }));
      
      return false;
    }
  }, [mountedRef]);

  return { syncUserData };
};
