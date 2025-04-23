
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
      
      // Calculer les valeurs intermédiaires avec une corrélation parfaite
      const currentAdsValue = startValueAds + (targetAdsCount - startValueAds) * easeProgress;
      
      // Pour une parfaite synchronisation:
      // 1. Calculer le delta des publicités
      const adsDelta = targetAdsCount - startValueAds;
      const revenueDelta = targetRevenueCount - startValueRevenue;
      
      // 2. Appliquer le même pourcentage de progression au revenu
      const currentRevenueValue = startValueRevenue + (revenueDelta * easeProgress);
      
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
