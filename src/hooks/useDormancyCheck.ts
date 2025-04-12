
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
    if (!userData) {
      // Si pas de données utilisateur, considérer comme en cours de chargement
      setIsChecking(true);
      return;
    }

    // Simuler une vérification de dormance
    const checkAccountDormancy = async () => {
      setIsChecking(true);

      try {
        // La vérification est simulée
        // Dans une vraie application, ceci serait une requête API
        await new Promise(resolve => setTimeout(resolve, 500));

        // Supposons qu'un compte est dormant après 30 jours d'inactivité
        const lastActivity = userData.lastLogin || userData.registeredAt || new Date();
        const daysSinceLastActivity = getDaysSince(lastActivity);

        // Si plus de 30 jours sans activité, marquer comme dormant
        const accountIsDormant = daysSinceLastActivity > 30;

        setIsDormant(accountIsDormant);
        setDormancyData({
          daysSinceLastActivity,
          accountStatus: accountIsDormant ? 'dormant' : 'active',
          lastActivityDate: lastActivity.toISOString(),
        });
      } catch (error) {
        console.error("Error checking account dormancy:", error);
        // Par défaut, considérer le compte comme actif en cas d'erreur
        setIsDormant(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Exécuter la vérification
    checkAccountDormancy();
  }, [userData]);

  // Fonction pour réactiver un compte dormant
  const handleReactivate = useCallback(async () => {
    setIsChecking(true);

    try {
      // Simuler une requête de réactivation
      await new Promise(resolve => setTimeout(resolve, 800));

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
