
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const useUserDataSync = () => {
  // Function to synchronize data with better stability
  const syncUserData = useCallback(async () => {
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
      
      const userId = session.user.id;
      
      // Use a more reliable approach to wait for session establishment
      let attempts = 0;
      const maxAttempts = 5; // Augmenté pour plus de fiabilité
      let syncSuccess = false;
      
      while (attempts < maxAttempts && !syncSuccess) {
        try {
          // Add progressive delay between attempts
          if (attempts > 0) {
            await new Promise(resolve => setTimeout(resolve, 300 * attempts));
          }
          
          // Récupérer les données utilisateur avec une requête parallèle
          const [userBalanceResult, profileResult] = await Promise.all([
            supabase.from('user_balances').select('subscription, balance, daily_session_count').eq('id', userId).maybeSingle(),
            supabase.from('profiles').select('full_name, email').eq('id', userId).maybeSingle()
          ]);
          
          // Vérifier les résultats et mettre à jour le localStorage
          if (!userBalanceResult.error && userBalanceResult.data) {
            const userData = userBalanceResult.data;
            
            // Synchroniser avec l'ID utilisateur specifique
            // Mettre à jour l'abonnement dans localStorage
            if (userData.subscription) {
              localStorage.setItem(`subscription_${userId}`, userData.subscription);
              localStorage.setItem('subscription', userData.subscription); // Pour compatibilité
              console.log("Abonnement mis à jour:", userData.subscription);
            }
            
            // Mettre à jour le solde dans localStorage
            if (userData.balance !== undefined) {
              localStorage.setItem(`currentBalance_${userId}`, String(userData.balance));
              localStorage.setItem(`lastKnownBalance_${userId}`, String(userData.balance));
              // Pour compatibilité
              localStorage.setItem('currentBalance', String(userData.balance));
              localStorage.setItem('lastKnownBalance', String(userData.balance));
              console.log("Solde mis à jour:", userData.balance);
            }
            
            // Mettre à jour le compteur de sessions quotidiennes
            if (userData.daily_session_count !== undefined) {
              localStorage.setItem(`dailySessionCount_${userId}`, String(userData.daily_session_count));
              console.log("Compteur de sessions mis à jour:", userData.daily_session_count);
            }
            
            // Déclencher un événement pour la mise à jour des données
            window.dispatchEvent(new CustomEvent('user:refreshed', {
              detail: { 
                subscription: userData.subscription,
                balance: userData.balance,
                daily_session_count: userData.daily_session_count,
                userId
              }
            }));
            
            syncSuccess = true;
          } else if (userBalanceResult.error) {
            console.error("Erreur lors de la récupération du solde:", userBalanceResult.error);
          }
          
          // Récupérer et stocker le nom d'utilisateur
          if (!profileResult.error && profileResult.data && profileResult.data.full_name) {
            localStorage.setItem(`lastKnownUsername_${userId}`, profileResult.data.full_name);
            localStorage.setItem('lastKnownUsername', profileResult.data.full_name); // Pour compatibilité
            console.log("Nom d'utilisateur mis à jour:", profileResult.data.full_name);
            
            // Déclencher un événement pour signaler que le nom est disponible
            window.dispatchEvent(new CustomEvent('username:loaded', { 
              detail: { username: profileResult.data.full_name, userId }
            }));
            
            syncSuccess = true;
          } else if (session.user.user_metadata?.full_name) {
            // Fallback sur les métadonnées utilisateur
            localStorage.setItem(`lastKnownUsername_${userId}`, session.user.user_metadata.full_name);
            localStorage.setItem('lastKnownUsername', session.user.user_metadata.full_name); // Pour compatibilité
            console.log("Nom d'utilisateur récupéré des métadonnées:", session.user.user_metadata.full_name);
            
            // Déclencher un événement pour signaler que le nom est disponible
            window.dispatchEvent(new CustomEvent('username:loaded', { 
              detail: { username: session.user.user_metadata.full_name, userId }
            }));
            
            syncSuccess = true;
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
      
      // Si la synchronisation a échoué après plusieurs tentatives
      if (!syncSuccess && attempts >= maxAttempts) {
        console.error("La synchronisation a échoué après plusieurs tentatives");
        
        // Notifier l'utilisateur en cas d'échec
        toast({
          title: "Synchronisation des données",
          description: "Un problème est survenu lors de la récupération des données. Certaines fonctionnalités pourraient ne pas être disponibles.",
          variant: "destructive",
          duration: 5000
        });
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
  }, []);

  return { syncUserData };
};

export default useUserDataSync;
