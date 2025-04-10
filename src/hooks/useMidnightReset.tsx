
import { useEffect, useRef } from 'react';
import { UserData } from '@/types/userData';
import { shouldResetDailyCounters } from '@/utils/subscription';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to manage daily reset functionality at midnight
 */
export const useMidnightReset = (
  userData: UserData,
  incrementSessionCount: () => Promise<void>,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void
) => {
  const lastResetTimeRef = useRef<number>(Date.now());
  const resetInProgressRef = useRef<boolean>(false);
  
  // Fonction pour mettre à jour la dernière activité de l'utilisateur
  const updateUserActivity = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        // Mettre à jour le timestamp de dernière activité dans localStorage
        localStorage.setItem('lastActive', new Date().toISOString());
        
        // Stocker aussi l'ID utilisateur pour éviter la confusion entre comptes
        localStorage.setItem('lastActiveUserId', session.user.id);
      }
    } catch (e) {
      console.error("Erreur lors de la mise à jour de l'activité utilisateur:", e);
    }
  };
  
  useEffect(() => {
    // Mettre à jour l'activité au montage du hook
    updateUserActivity();
    
    // Vérifier si nous avons besoin de nettoyer les données locales
    // pour éviter la contamination entre utilisateurs différents
    const currentUserId = userData?.profile?.id || null;
    const storedUserId = localStorage.getItem('lastActiveUserId');
    
    if (currentUserId && storedUserId && currentUserId !== storedUserId) {
      console.log("Changement d'utilisateur détecté, nettoyage des données locales");
      // Nettoyer les données spécifiques à l'utilisateur
      localStorage.removeItem('currentBalance');
      localStorage.removeItem('lastKnownBalance');
      localStorage.removeItem('highestBalance');
      localStorage.removeItem('lastAutoSessionDate');
      localStorage.removeItem('lastAutoSessionTime');
      localStorage.removeItem('balanceState');
      
      // Mettre à jour l'ID utilisateur
      localStorage.setItem('lastActiveUserId', currentUserId);
    }
    
    const checkForDailyReset = () => {
      // Check if we should reset based on last reset time
      if (!resetInProgressRef.current && shouldResetDailyCounters(lastResetTimeRef.current)) {
        console.log("Daily reset triggered by time check");
        performDailyReset();
      }
    };
    
    // Check immediately when the component mounts
    checkForDailyReset();
    
    // Set up an interval to check regularly (every 5 minutes)
    const intervalId = setInterval(checkForDailyReset, 5 * 60 * 1000);
    
    // Specific check at midnight
    const checkAtMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      
      const timeToMidnight = nextMidnight.getTime() - now.getTime();
      
      // Schedule the reset for midnight
      const midnightTimer = setTimeout(() => {
        console.log("Daily reset triggered by midnight timer");
        performDailyReset();
        
        // Set up the next day's timer after this one fires
        checkAtMidnight();
      }, timeToMidnight);
      
      return midnightTimer;
    };
    
    // Set up the initial midnight check
    const midnightTimer = checkAtMidnight();
    
    return () => {
      clearInterval(intervalId);
      clearTimeout(midnightTimer);
    };
  }, [userData?.profile?.id]);
  
  const performDailyReset = async () => {
    // Empêcher les réinitialisations multiples
    if (resetInProgressRef.current) {
      console.log("Une réinitialisation est déjà en cours, annulation");
      return;
    }
    
    resetInProgressRef.current = true;
    
    try {
      // Only hide the limit alert if it's currently shown
      setShowLimitAlert(false);
      
      // Reset the daily session count
      await incrementSessionCount();
      
      // Clear the today's gains counter in localStorage
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      localStorage.setItem('lastAutoSessionDate', dateStr);
      
      // Réinitialiser le compteur de sessions aujourd'hui
      localStorage.setItem('todaySessionCount', '0');
      
      // Réactiver le bot
      window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
        detail: { active: true }
      }));
      
      // Update the last reset time
      lastResetTimeRef.current = Date.now();
      localStorage.setItem('lastResetTime', lastResetTimeRef.current.toString());
      
      // Display a notification about the reset
      toast({
        title: "Limite journalière réinitialisée",
        description: "Vos gains journaliers ont été réinitialisés. Vous pouvez à nouveau générer des revenus aujourd'hui!",
        action: (
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('dashboard:refresh'))}
            className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded text-xs"
          >
            Générer maintenant
          </button>
        )
      });
      
      // Dispatch an event to refresh the UI
      window.dispatchEvent(new CustomEvent('daily-reset:complete'));
      
    } catch (error) {
      console.error("Error during daily reset:", error);
    } finally {
      resetInProgressRef.current = false;
    }
  };

  return { performDailyReset };
};
