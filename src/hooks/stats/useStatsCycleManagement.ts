
import { useCallback } from 'react';
import { calculateTimeUntilMidnight } from '@/utils/timeUtils';
import { toast } from '@/components/ui/use-toast';

interface UseStatsCycleManagementParams {
  setAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

export const useStatsCycleManagement = ({
  setAdsCount,
  setRevenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount,
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsCycleManagementParams) => {
  // Planifier la mise à jour du cycle à minuit, heure de Paris
  const scheduleCycleUpdate = useCallback(() => {
    const timeUntilMidnight = calculateTimeUntilMidnight();
    
    // Convertir en heures pour les logs
    const hoursUntilMidnight = Math.floor(timeUntilMidnight / 1000 / 60 / 60);
    const minutesUntilMidnight = Math.floor((timeUntilMidnight / 1000 / 60) % 60);
    
    console.log(`Prochaine réinitialisation des compteurs dans ${hoursUntilMidnight} heures et ${minutesUntilMidnight} minutes`);
    
    const resetTimeout = setTimeout(() => {
      // Récupérer les valeurs actuelles
      let previousAds = 0;
      let previousRevenue = 0;
      
      try {
        const savedAds = localStorage.getItem('totalProcessedAds');
        const savedRevenue = localStorage.getItem('totalGeneratedRevenue');
        
        if (savedAds) previousAds = parseInt(savedAds, 10);
        if (savedRevenue) previousRevenue = parseInt(savedRevenue, 10);
      } catch (e) {
        console.error("Erreur lors de la récupération des totaux:", e);
      }
      
      // Ajouter les compteurs du jour aux totaux
      setAdsCount(currentAds => {
        const newTotal = previousAds + currentAds;
        localStorage.setItem('totalProcessedAds', newTotal.toString());
        return dailyAdsTarget; // Réinitialiser pour le nouveau jour
      });
      
      setRevenueCount(currentRevenue => {
        const newTotal = previousRevenue + currentRevenue;
        localStorage.setItem('totalGeneratedRevenue', newTotal.toString());
        return dailyRevenueTarget; // Réinitialiser pour le nouveau jour
      });
      
      // Réinitialiser les compteurs affichés pour le nouveau jour
      setDisplayedAdsCount(0);
      setDisplayedRevenueCount(0);
      
      // Réactiver le bot pour le nouveau jour
      window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
        detail: { active: true } 
      }));
      
      toast({
        title: "Nouveau cycle commencé!",
        description: "Vos revenus d'hier ont été sécurisés, et un nouveau jour de gains commence.",
        duration: 5000
      });
      
      console.log("RÉINITIALISATION DU CYCLE À MINUIT - Bot réactivé!");
      
      // Planifier la prochaine réinitialisation
      scheduleCycleUpdate();
    }, timeUntilMidnight);
    
    return resetTimeout;
  }, [setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount, dailyAdsTarget, dailyRevenueTarget]);
  
  // Logique d'incrémentation repensée pour une progression plus naturelle et imprévisible
  const incrementCountersRandomly = useCallback(() => {
    // Simuler le travail de multiples agents IA analysant des publicités de durées différentes
    setAdsCount(prevAdsCount => {
      if (prevAdsCount >= dailyAdsTarget) return dailyAdsTarget;
      
      // Générer une incrémentation aléatoire qui simule plusieurs agents IA travaillant en parallèle
      // Plus le nombre est grand, plus l'impression qu'il y a plusieurs agents est forte
      const baseIncrement = Math.floor(Math.random() * 400) + 100; // Entre 100 et 500 pubs par mise à jour
      
      // Variation selon l'heure de la journée (plus actif aux heures de pointe)
      const now = new Date();
      const hourFactor = getHourFactor(now.getHours());
      
      // Calculer l'incrément final avec facteur horaire
      const adjustedIncrement = Math.floor(baseIncrement * hourFactor);
      
      // S'assurer que nous ne dépassons pas la cible
      const newAdsCount = Math.min(prevAdsCount + adjustedIncrement, dailyAdsTarget);
      
      // Toujours mettre à jour les revenus en même temps que les annonces, mais avec variabilité
      setRevenueCount(prevRevenueCount => {
        if (prevRevenueCount >= dailyRevenueTarget) return dailyRevenueTarget;
        
        // Calculer le revenu moyen par publicité avec une variabilité
        const adsIncrement = newAdsCount - prevAdsCount;
        const averageRevenuePerAd = dailyRevenueTarget / dailyAdsTarget;
        
        // Ajouter de la variabilité aux revenus pour simuler des publicités de valeurs différentes
        const variabilityFactor = 0.8 + Math.random() * 0.5; // Entre 0.8 et 1.3
        const revenueIncrement = Math.floor(adsIncrement * averageRevenuePerAd * variabilityFactor);
        
        return Math.min(prevRevenueCount + revenueIncrement, dailyRevenueTarget);
      });
      
      // Sauvegarder les totaux progressifs
      try {
        const savedAds = localStorage.getItem('totalProcessedAds') || '0';
        const totalAds = parseInt(savedAds, 10) + adjustedIncrement;
        localStorage.setItem('totalProcessedAds', totalAds.toString());
        
        // Mettre à jour les compteurs cumulatifs pour l'affichage
        window.dispatchEvent(new CustomEvent('stats:totals-updated', {
          detail: { totalAds: totalAds }
        }));
      } catch (e) {
        console.error("Erreur lors de la sauvegarde des totaux:", e);
      }
      
      return newAdsCount;
    });
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount]);

  // Fonction utilitaire pour obtenir un facteur multiplicateur selon l'heure
  // Les agents IA sont plus actifs pendant certaines périodes de la journée
  const getHourFactor = (hour: number): number => {
    // Heures de pointe: 9h-12h et 14h-19h
    if ((hour >= 9 && hour <= 12) || (hour >= 14 && hour <= 19)) {
      return 1.1 + Math.random() * 0.4; // Entre 1.1 et 1.5
    } 
    // Heures de faible activité: 1h-6h
    else if (hour >= 1 && hour <= 6) {
      return 0.5 + Math.random() * 0.3; // Entre 0.5 et 0.8
    }
    // Heures normales: reste de la journée
    else {
      return 0.8 + Math.random() * 0.4; // Entre 0.8 et 1.2
    }
  };

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};
