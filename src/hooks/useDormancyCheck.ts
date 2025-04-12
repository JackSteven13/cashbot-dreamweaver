
import { useState, useEffect, useCallback } from 'react';
import { UserData } from '@/types/userData';

interface DormancyData {
  daysSinceLastActivity: number;
  accountStatus: string;
  lastActivityDate?: string;
}

interface UseDormancyCheckReturn {
  isDormant: boolean;
  isChecking: boolean;
  dormancyData: DormancyData | null;
  handleReactivate: () => Promise<void>;
}

/**
 * Hook pour vérifier si un compte est dormant
 */
export const useDormancyCheck = (
  userData: UserData | null,
  showLimitAlert: boolean
): UseDormancyCheckReturn => {
  const [isDormant, setIsDormant] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [dormancyData, setDormancyData] = useState<DormancyData | null>(null);

  // Vérifie la dormance du compte
  useEffect(() => {
    let isMounted = true;
    let checkTimeout: NodeJS.Timeout | null = null;
    
    // Vérifie si le composant est toujours monté avant de mettre à jour l'état
    const safeUpdate = (updates: any) => {
      if (isMounted) {
        Object.entries(updates).forEach(([key, value]) => {
          switch(key) {
            case 'isDormant':
              setIsDormant(value as boolean);
              break;
            case 'isChecking':
              setIsChecking(value as boolean);
              break;
            case 'dormancyData':
              setDormancyData(value as DormancyData | null);
              break;
          }
        });
      }
    };
    
    // Force la fin de la vérification après un délai maximal
    const forceCompleteCheck = () => {
      checkTimeout = setTimeout(() => {
        if (isMounted && isChecking) {
          console.log("Forçage de la fin de la vérification de dormance après timeout");
          safeUpdate({
            isChecking: false,
            isDormant: false // Par défaut, considérer comme actif
          });
        }
      }, 3000); // Forcer la fin après 3 secondes maximum
    };

    if (!userData) {
      // Si pas de données utilisateur, considérer comme en cours de chargement mais pas dormant
      safeUpdate({ 
        isChecking: false,  // ⚠️ Important: ne pas bloquer l'UI si pas de données
        isDormant: false 
      });
      return;
    }

    // Démarrer la vérification avec un timeout de sécurité
    forceCompleteCheck();
    
    // Simuler une vérification de dormance
    const checkAccountDormancy = async () => {
      try {
        // La vérification est simulée
        // Dans une vraie application, ceci serait une requête API
        await new Promise(resolve => setTimeout(resolve, 200)); // Réduire le délai pour plus de réactivité

        if (!isMounted) return;
        
        // Supposons qu'un compte est dormant après 30 jours d'inactivité
        const lastActivity = userData.lastLogin || userData.registeredAt || new Date();
        const daysSinceLastActivity = getDaysSince(lastActivity);

        // Si plus de 30 jours sans activité, marquer comme dormant
        const accountIsDormant = daysSinceLastActivity > 30;

        safeUpdate({
          isDormant: accountIsDormant,
          isChecking: false,
          dormancyData: {
            daysSinceLastActivity,
            accountStatus: accountIsDormant ? 'dormant' : 'active',
            lastActivityDate: lastActivity.toISOString(),
          }
        });
      } catch (error) {
        console.error("Error checking account dormancy:", error);
        // Par défaut, considérer le compte comme actif en cas d'erreur
        safeUpdate({
          isDormant: false,
          isChecking: false
        });
      }
    };

    // Exécuter la vérification avec un court délai pour éviter les blocages
    const timer = setTimeout(() => {
      checkAccountDormancy();
    }, 50);

    return () => {
      isMounted = false;
      if (checkTimeout) clearTimeout(checkTimeout);
      clearTimeout(timer);
    };
  }, [userData]);

  // Fonction pour réactiver un compte dormant
  const handleReactivate = useCallback(async () => {
    setIsChecking(true);

    try {
      // Simuler une requête de réactivation
      await new Promise(resolve => setTimeout(resolve, 400)); // Réduire le délai pour plus de réactivité

      // Marquer le compte comme actif
      setIsDormant(false);
      if (dormancyData) {
        setDormancyData({
          ...dormancyData,
          accountStatus: 'active',
          daysSinceLastActivity: 0,
        });
      }
    } catch (error) {
      console.error("Error reactivating account:", error);
    } finally {
      // S'assurer de toujours terminer le processus
      setIsChecking(false);
    }
  }, [dormancyData]);

  return { isDormant, isChecking, dormancyData, handleReactivate };
};

// Fonction utilitaire pour calculer le nombre de jours depuis une date
function getDaysSince(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default useDormancyCheck;
