
import { useState, useEffect, useCallback } from 'react';
import { 
  calculateCurrentCounters, 
  shouldUpdateCounters, 
  updateStoredCounters
} from '@/utils/stats/statsEvolutionManager';

interface UsePersistentStatsProps {
  autoIncrement?: boolean;
  userId?: string;
  forceGrowth?: boolean;
  correlationRatio?: number; // Nouveau paramètre pour la corrélation entre les compteurs
}

const ADS_COUNT_KEY = 'ads_count';
const REVENUE_COUNT_KEY = 'revenue_count';
const LAST_UPDATE_KEY = 'stats_last_update';

const usePersistentStats = ({ 
  autoIncrement = false,
  userId,
  forceGrowth = false,
  correlationRatio = 0.75 // Valeur par défaut: 0.75€ par publicité analysée en moyenne
}: UsePersistentStatsProps) => {
  // Initialiser les compteurs avec des valeurs du localStorage ou avec des valeurs calculées
  const initializeCounters = () => {
    // Vérifier si une mise à jour basée sur le temps est nécessaire
    const needsTimeUpdate = shouldUpdateCounters() || forceGrowth;
    
    if (needsTimeUpdate) {
      // Calculer de nouvelles valeurs basées sur le temps écoulé
      const { adsCount, revenueCount } = calculateCurrentCounters();
      
      try {
        localStorage.setItem(ADS_COUNT_KEY, adsCount.toString());
        localStorage.setItem(REVENUE_COUNT_KEY, revenueCount.toString());
        localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
      } catch (e) {
        console.error('Erreur lors de la sauvegarde des compteurs:', e);
      }
      
      console.log('Using calculated values:', { adsCount, revenueCount });
      return { adsCount, revenueCount, hasStoredValues: true };
    }
    
    // Récupérer les valeurs précédemment stockées
    const storedAdsCount = localStorage.getItem(ADS_COUNT_KEY);
    const storedRevenueCount = localStorage.getItem(REVENUE_COUNT_KEY);
    
    // Si nous avons des valeurs stockées, les utiliser
    if (storedAdsCount && storedRevenueCount) {
      const adsCount = parseInt(storedAdsCount, 10);
      const revenueCount = parseFloat(storedRevenueCount);
      
      // Ajouter une petite variation pour montrer de l'activité
      const updatedAdsCount = adsCount + Math.floor(Math.random() * 20) + 5;
      // Assurer que les revenus augmentent proportionnellement aux publicités
      const updatedRevenueCount = revenueCount + ((updatedAdsCount - adsCount) * correlationRatio * (0.95 + Math.random() * 0.1));
      
      // Mettre à jour le stockage
      try {
        localStorage.setItem(ADS_COUNT_KEY, updatedAdsCount.toString());
        localStorage.setItem(REVENUE_COUNT_KEY, updatedRevenueCount.toString());
        localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
      } catch (e) {
        console.error('Erreur lors de la mise à jour des compteurs:', e);
      }
      
      console.log('Using stored values:', { adsCount: updatedAdsCount, revenueCount: updatedRevenueCount });
      return { 
        adsCount: updatedAdsCount, 
        revenueCount: updatedRevenueCount, 
        hasStoredValues: true 
      };
    }
    
    // Valeurs par défaut si aucune valeur n'est stockée
    // Ces valeurs sont assez élevées pour donner l'impression d'un système déjà établi
    const defaultAdsCount = 152000 + Math.floor(Math.random() * 1000);
    const defaultRevenueCount = 116000 + Math.floor(Math.random() * 500);
    
    try {
      localStorage.setItem(ADS_COUNT_KEY, defaultAdsCount.toString());
      localStorage.setItem(REVENUE_COUNT_KEY, defaultRevenueCount.toString());
      localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
    } catch (e) {
      console.error('Erreur lors de l\'initialisation des compteurs:', e);
    }
    
    console.log('Compteurs initialisés avec des valeurs cohérentes et progressives:', { 
      adsCount: defaultAdsCount, 
      revenueCount: defaultRevenueCount 
    });
    
    return { adsCount: defaultAdsCount, revenueCount: defaultRevenueCount, hasStoredValues: false };
  };
  
  const { adsCount: initialAdsCount, revenueCount: initialRevenueCount } = initializeCounters();
  
  const [adsCount, setAdsCount] = useState(initialAdsCount);
  const [revenueCount, setRevenueCount] = useState(initialRevenueCount);
  
  // Fonction pour incrémenter les compteurs manuellement
  const incrementStats = useCallback((adsIncrement: number, revenueIncrement: number) => {
    // Si revenueIncrement est fourni, l'utiliser, sinon calculer en fonction du ratio
    const actualRevenueIncrement = revenueIncrement > 0 ? 
      revenueIncrement : 
      adsIncrement * correlationRatio * (0.95 + Math.random() * 0.1);
    
    setAdsCount(prevAdsCount => {
      const newAdsCount = prevAdsCount + adsIncrement;
      try {
        localStorage.setItem(ADS_COUNT_KEY, newAdsCount.toString());
      } catch (e) {
        console.error('Erreur lors de la mise à jour du compteur d\'annonces:', e);
      }
      return newAdsCount;
    });
    
    setRevenueCount(prevRevenueCount => {
      const newRevenueCount = prevRevenueCount + actualRevenueIncrement;
      try {
        localStorage.setItem(REVENUE_COUNT_KEY, newRevenueCount.toString());
      } catch (e) {
        console.error('Erreur lors de la mise à jour du compteur de revenus:', e);
      }
      return newRevenueCount;
    });
    
    // Mettre à jour la dernière mise à jour
    localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
    
    // Mettre à jour les données d'évolution stockées
    updateStoredCounters(adsCount + adsIncrement, revenueCount + actualRevenueIncrement);
  }, [adsCount, revenueCount, correlationRatio]);
  
  // Incrémenter automatiquement les compteurs à intervalles réguliers
  useEffect(() => {
    if (!autoIncrement) return;
    
    // Incrémenter les compteurs périodiquement avec des valeurs réalistes
    const intervalId = setInterval(() => {
      const adsIncrement = Math.floor(Math.random() * 15) + 5; // 5-19
      // Le revenu est maintenant calculé en fonction des publicités analysées
      const revenueIncrement = adsIncrement * correlationRatio * (0.95 + Math.random() * 0.1);
      
      incrementStats(adsIncrement, revenueIncrement);
    }, 15000); // Toutes les 15 secondes
    
    return () => clearInterval(intervalId);
  }, [autoIncrement, incrementStats, correlationRatio]);
  
  return { adsCount, revenueCount, incrementStats };
};

export default usePersistentStats;
