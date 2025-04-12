
import { useState, useEffect, useRef, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getMaxSessionsForSubscription } from '@/utils/balance/limitCalculations';

type UpdateBalanceFunction = (gain: number, report: string, forceUpdate: boolean) => Promise<void>;

export const useAutomaticRevenue = (
  userData: UserData | null,
  updateBalance: UpdateBalanceFunction,
  isNewUser: boolean
) => {
  const [isBotActive, setIsBotActive] = useState(false);
  const [dailyLimitProgress, setDailyLimitProgress] = useState(0);
  const maxSessionsRef = useRef(5); // valeur par défaut pour freemium
  const activeUserIdRef = useRef<string | null>(null);
  
  // Mettre à jour la limite maximale selon l'abonnement
  useEffect(() => {
    if (userData) {
      const subscription = userData.subscription || 'freemium';
      maxSessionsRef.current = getMaxSessionsForSubscription(subscription);
      
      // Si l'utilisateur a une session active, stocker son ID
      if (userData.profile?.id) {
        activeUserIdRef.current = userData.profile.id;
        
        // Essayer de récupérer la progression depuis le localStorage
        try {
          const storedProgress = localStorage.getItem(`dailyLimitProgress_${userData.profile.id}`);
          const storedCount = localStorage.getItem(`dailySessionCount_${userData.profile.id}`);
          
          if (storedCount) {
            const sessionCount = parseInt(storedCount, 10);
            const progress = (sessionCount / maxSessionsRef.current) * 100;
            setDailyLimitProgress(progress);
          } else if (storedProgress) {
            setDailyLimitProgress(parseFloat(storedProgress));
          } else if (userData.dailySessionCount !== undefined) {
            const progress = (userData.dailySessionCount / maxSessionsRef.current) * 100;
            setDailyLimitProgress(progress);
          }
        } catch (e) {
          console.error("Erreur lors de la récupération de la progression:", e);
        }
      }
    }
  }, [userData]);
  
  // Fonction pour générer des revenus automatiques
  const generateAutomaticRevenue = useCallback(
    async (forceUpdate: boolean = false): Promise<void> => {
      // Empêcher les générations pour les nouveaux utilisateurs
      if (isNewUser) {
        console.log("Génération de revenus annulée - nouvel utilisateur");
        return;
      }
      
      // Ne rien faire si les données utilisateur ne sont pas disponibles
      if (!userData || !userData.profile?.id) {
        console.log("Génération de revenus annulée - données utilisateur manquantes");
        return;
      }
      
      setIsBotActive(true);
      
      try {
        // Vérifier la session utilisateur
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("Génération de revenus annulée - pas de session active");
          setIsBotActive(false);
          return;
        }
        
        const userId = session.user.id;
        
        // Récupérer le compteur de sessions quotidien actuel
        const { data: userData, error: countError } = await supabase
          .from('user_balances')
          .select('daily_session_count, subscription')
          .eq('id', userId)
          .single();
        
        if (countError) {
          throw new Error(`Erreur lors de la récupération du compteur de sessions: ${countError.message}`);
        }
        
        const currentSessionCount = userData.daily_session_count;
        const subscription = userData.subscription || 'freemium';
        const maxSessions = getMaxSessionsForSubscription(subscription);
        
        // Vérifier si la limite quotidienne est atteinte
        if (currentSessionCount >= maxSessions) {
          toast({
            title: "Limite quotidienne atteinte",
            description: `Vous avez atteint votre limite de ${maxSessions} sessions pour aujourd'hui.`,
            variant: "destructive"
          });
          setIsBotActive(false);
          return;
        }
        
        // Incrémenter le compteur de sessions
        const { error: updateError } = await supabase
          .from('user_balances')
          .update({ daily_session_count: currentSessionCount + 1 })
          .eq('id', userId);
        
        if (updateError) {
          throw new Error(`Erreur lors de la mise à jour du compteur de sessions: ${updateError.message}`);
        }
        
        // Calculer les gains selon l'abonnement
        let gain = 0;
        let gainDescription = '';
        
        switch (subscription) {
          case 'elite':
            gain = (Math.random() * 0.5 + 0.8).toFixed(2);
            gainDescription = "Revenu Elite";
            break;
          case 'gold':
            gain = (Math.random() * 0.4 + 0.6).toFixed(2);
            gainDescription = "Revenu Gold";
            break;
          case 'starter':
          case 'alpha':
            gain = (Math.random() * 0.3 + 0.4).toFixed(2);
            gainDescription = "Revenu Starter";
            break;
          case 'freemium':
          default:
            gain = (Math.random() * 0.2 + 0.2).toFixed(2);
            gainDescription = "Revenu Gratuit";
            break;
        }
        
        // Mettre à jour le solde
        await updateBalance(parseFloat(gain), gainDescription, true);
        
        // Mettre à jour la progression
        const newSessionCount = currentSessionCount + 1;
        const progress = (newSessionCount / maxSessions) * 100;
        setDailyLimitProgress(progress);
        
        // Sauvegarder la progression dans le localStorage
        localStorage.setItem(`dailyLimitProgress_${userId}`, progress.toString());
        localStorage.setItem(`dailySessionCount_${userId}`, newSessionCount.toString());
        
      } catch (error) {
        console.error("Erreur lors de la génération de revenus:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la génération de revenus.",
          variant: "destructive"
        });
      } finally {
        setIsBotActive(false);
      }
    },
    [userData, updateBalance, isNewUser]
  );
  
  return {
    isBotActive,
    dailyLimitProgress,
    generateAutomaticRevenue
  };
};
