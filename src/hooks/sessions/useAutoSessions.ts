
import { useState, useEffect, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { calculateAutoSessionGain } from '@/utils/subscription/sessionGain';
import { useBotStatus } from '@/hooks/useBotStatus';
import balanceManager from '@/utils/balance/balanceManager';

interface AutoSessionsProps {
  userData: UserData;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  setShowLimitAlert: (show: boolean) => void;
}

export const useAutoSessions = ({ userData, updateBalance, setShowLimitAlert }: AutoSessionsProps) => {
  const [lastAutoSessionTime, setLastAutoSessionTime] = useState<Date | null>(null);
  const { isBotActive, activityLevel } = useBotStatus();

  // Simuler une session automatique périodiquement si le bot est actif
  useEffect(() => {
    let sessionTimer: NodeJS.Timeout | null = null;

    const runAutoSession = async () => {
      if (!isBotActive || !userData?.subscription) {
        return;
      }
      
      try {
        // Calculer le gain en fonction du niveau d'abonnement et de l'activité du bot
        const gain = calculateAutoSessionGain(
          userData.subscription,
          balanceManager.getDailyGains(),
          userData.referrals?.length || 0
        );

        // Si le gain est nul (limite atteinte), ne pas continuer
        if (gain <= 0) {
          console.log("Limite quotidienne atteinte pour les sessions automatiques");
          setShowLimitAlert(true);
          return;
        }
        
        console.log(`Génération automatique: gain=${gain}, activité=${activityLevel}`);

        // Ajouter le gain au solde
        const gainAdded = balanceManager.addDailyGain(gain, userData.subscription);
        
        // Si le gain n'a pas pu être ajouté (limite atteinte), désactiver le bot
        if (!gainAdded) {
          console.log("Limite quotidienne atteinte, désactivation du bot");
          
          // Désactiver le bot via l'événement global
          window.dispatchEvent(new CustomEvent('bot:force-status', {
            detail: { active: false, reason: 'limit_reached' }
          }));
          
          setShowLimitAlert(true);
          return;
        }

        // Ajouter le gain au bilan complet
        const report = `Analyse automatique de contenu`;
        await updateBalance(gain, report);
        
        // Mettre à jour l'heure de la dernière session
        setLastAutoSessionTime(new Date());
        
        // Déclencher des événements d'activité
        window.dispatchEvent(new CustomEvent('dashboard:activity', {
          detail: { level: 'normal', agents: Math.ceil(Math.random() * 3) + 1 }
        }));
        
        // Micro-gain pour les animations
        window.dispatchEvent(new CustomEvent('micro-gain', {
          detail: { amount: gain, agent: Math.ceil(Math.random() * 5) }
        }));
      } catch (error) {
        console.error("Erreur lors de la session automatique:", error);
      } finally {
        // Planifier la prochaine session avec un délai variable
        // Le délai est plus court si l'activité est élevée
        const baseDelay = isBotActive ? 45000 : 120000; // 45s ou 2min
        const activityFactor = Math.max(0.5, Math.min(1.5, activityLevel / 50));
        const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8-1.2
        
        const nextDelay = Math.floor(baseDelay / activityFactor * randomFactor);
        
        sessionTimer = setTimeout(runAutoSession, nextDelay);
      }
    };

    // Démarrer la première session automatique avec un délai initial
    const initialDelay = 5000 + Math.random() * 8000; // 5-13 secondes
    sessionTimer = setTimeout(runAutoSession, initialDelay);

    // Nettoyer le timer quand le composant est démonté
    return () => {
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }
    };
  }, [isBotActive, userData, updateBalance, activityLevel, setShowLimitAlert]);

  return {
    lastAutoSessionTime,
    activityLevel,
    isBotActive
  };
};

export default useAutoSessions;
