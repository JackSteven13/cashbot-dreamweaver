
import { useEffect, useRef } from 'react';

interface UseStatsAnimationParams {
  adsCount: number;
  revenueCount: number;
  setDisplayedAdsCount: (count: number) => void;
  setDisplayedRevenueCount: (count: number) => void;
}

/**
 * Hook qui fournit une animation fluide entre les mises à jour des compteurs
 */
export const useStatsAnimation = ({
  adsCount,
  revenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount
}: UseStatsAnimationParams) => {
  const animationFrame = useRef<number | null>(null);
  const lastAnimatedValueAds = useRef<number>(adsCount);
  const lastAnimatedValueRevenue = useRef<number>(revenueCount);

  // Fonction pour animer les compteurs avec animation fluide
  const animateCounters = (targetAdsCount: number, targetRevenueCount: number, duration = 1000) => {
    const startTime = Date.now();
    const startValueAds = lastAnimatedValueAds.current;
    const startValueRevenue = lastAnimatedValueRevenue.current;
    
    // Fonction d'animation
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Courbe d'animation avec easeOutCubic pour plus de réalisme
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // Calculer les valeurs intermédiaires avec un facteur de corrélation 
      // pour garantir que les revenus augmentent proportionnellement aux publicités
      const currentAdsValue = startValueAds + (targetAdsCount - startValueAds) * easeProgress;
      
      // 2 variantes pour calculer les revenus:
      // 1. Sur la base d'une animation directe entre les valeurs de départ et de fin
      const directRevenueValue = startValueRevenue + (targetRevenueCount - startValueRevenue) * easeProgress;
      
      // 2. Sur la base de la corrélation avec les publicités (environ 0.75€ par pub en moyenne)
      const adsDifference = currentAdsValue - startValueAds;
      const correlationFactor = 0.75 * (0.97 + Math.random() * 0.06); // Légère variation pour réalisme
      const correlatedRevenue = startValueRevenue + (adsDifference * correlationFactor);
      
      // Utiliser une combinaison des deux méthodes pour un équilibre entre cohérence et transition fluide
      const currentRevenueValue = (directRevenueValue * 0.7) + (correlatedRevenue * 0.3);
      
      // Mettre à jour les compteurs
      setDisplayedAdsCount(currentAdsValue);
      setDisplayedRevenueCount(currentRevenueValue);
      
      // Mettre à jour les dernières valeurs animées
      lastAnimatedValueAds.current = currentAdsValue;
      lastAnimatedValueRevenue.current = currentRevenueValue;
      
      // Continuer l'animation si pas terminée
      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };
    
    // Annuler l'animation précédente si elle existe
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    
    // Démarrer la nouvelle animation
    animationFrame.current = requestAnimationFrame(animate);
  };

  // Nettoyer l'animation à la destruction du hook
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  return {
    animateCounters
  };
};

export default useStatsAnimation;
