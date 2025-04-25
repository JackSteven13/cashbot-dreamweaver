
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import balanceManager from '@/utils/balance/balanceManager';
import { getStorageKeys, cleanOtherUserData } from '@/utils/balance/balanceStorage';

export const useUserDataSync = () => {
  // Fonction améliorée pour synchroniser les données avec une meilleure stabilité
  const syncUserData = useCallback(async (forceRefresh = false) => {
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
      
      // Stocker l'ID utilisateur pour permettre le nettoyage des données d'autres utilisateurs
      localStorage.setItem('lastKnownUserId', userId);
      
      // Nettoyer les données d'autres utilisateurs
      cleanOtherUserData(userId);
      
      // Vider explicitement les anciennes valeurs globales pour éviter la contamination
      localStorage.removeItem('lastKnownUsername');
      localStorage.removeItem('subscription');
      
      // Use a more reliable approach to wait for session establishment
      let attempts = 0;
      const maxAttempts = 5;
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
          
          // Obtenir les clés spécifiques à l'utilisateur pour stocker les données
          const userKeys = getStorageKeys(userId);
          
          // Vérifier les résultats et mettre à jour le localStorage
          if (!userBalanceResult.error && userBalanceResult.data) {
            const userData = userBalanceResult.data;
            
            // Mettre à jour l'abonnement dans localStorage avec une clé spécifique à l'utilisateur
            if (userData.subscription) {
              localStorage.setItem(`subscription_${userId}`, userData.subscription);
              console.log("Abonnement mis à jour:", userData.subscription);
            }
            
            // Mettre à jour le solde dans localStorage avec une clé spécifique à l'utilisateur
            if (userData.balance !== undefined) {
              localStorage.setItem(userKeys.currentBalance, String(userData.balance));
              localStorage.setItem(userKeys.lastKnownBalance, String(userData.balance));
              
              // Définir également l'ID utilisateur dans le gestionnaire de solde
              balanceManager.setUserId(userId);
              balanceManager.forceBalanceSync(userData.balance, userId);
              
              console.log("Solde mis à jour:", userData.balance);
            }
            
            // Mettre à jour le compteur de sessions quotidiennes
            if (userData.daily_session_count !== undefined) {
              localStorage.setItem(`dailySessionCount_${userId}`, String(userData.daily_session_count));
              console.log("Compteur de sessions mis à jour:", userData.daily_session_count);
            }
            
            syncSuccess = true;
          } else if (userBalanceResult.error) {
            console.error("Erreur lors de la récupération du solde:", userBalanceResult.error);
          }
          
          // Récupérer et stocker le nom d'utilisateur
          if (!profileResult.error && profileResult.data && profileResult.data.full_name) {
            // Stocker le nom uniquement avec une clé spécifique à l'utilisateur
            localStorage.setItem(`lastKnownUsername_${userId}`, profileResult.data.full_name);
            console.log("Nom d'utilisateur mis à jour:", profileResult.data.full_name);
            syncSuccess = true;
            
            // Déclencher un événement pour signaler que le nom est disponible
            window.dispatchEvent(new CustomEvent('username:loaded', { 
              detail: { username: profileResult.data.full_name, userId }
            }));
          } else if (session.user.user_metadata?.full_name) {
            // Fallback sur les métadonnées utilisateur
            localStorage.setItem(`lastKnownUsername_${userId}`, session.user.user_metadata.full_name);
            console.log("Nom d'utilisateur récupéré des métadonnées:", session.user.user_metadata.full_name);
            syncSuccess = true;
            
            // Déclencher un événement pour signaler que le nom est disponible
            window.dispatchEvent(new CustomEvent('username:loaded', { 
              detail: { username: session.user.user_metadata.full_name, userId }
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
      const forceRefreshFlag = localStorage.getItem('forceRefreshBalance');
      if (forceRefreshFlag === 'true' || forceRefresh) {
        console.log("Force refresh detected, clearing flag");
        localStorage.removeItem('forceRefreshBalance');
        
        // Déclencher un événement pour forcer la mise à jour de l'interface
        const userKeys = getStorageKeys(userId);
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { 
            balance: localStorage.getItem(userKeys.currentBalance),
            subscription: localStorage.getItem(`subscription_${userId}`),
            userId
          }
        }));
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

// Also export as default for backward compatibility
export default useUserDataSync;
