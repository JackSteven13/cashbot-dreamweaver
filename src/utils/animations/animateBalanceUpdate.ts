
/**
 * Utilitaires pour animer les mises à jour du solde
 */

/**
 * Déclenche une animation de mise à jour du solde
 */
export const animateBalanceUpdate = (
  startValue: number, 
  endValue: number,
  onUpdate: (value: number) => void,
  duration = 1000,
  easing: (t: number) => number = (t) => t * t * (3 - 2 * t)
): void => {
  const startTime = performance.now();
  
  const animate = (currentTime: number) => {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const easedProgress = easing(progress);
    
    // Calculer la valeur actuelle
    const currentValue = startValue + (endValue - startValue) * easedProgress;
    
    // Appeler la fonction de mise à jour
    onUpdate(parseFloat(currentValue.toFixed(2)));
    
    // Continuer l'animation si elle n'est pas terminée
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  // Démarrer l'animation
  requestAnimationFrame(animate);
};

/**
 * Convertit les événements de gain en animations
 */
export const setupBalanceAnimations = (): () => void => {
  // Conversion des événements dashboard:micro-gain en animations de solde
  const handleMicroGain = (event: CustomEvent) => {
    const { amount } = event.detail || {};
    if (typeof amount === 'number' && amount > 0) {
      animateBalanceUpdate(0, amount, () => {});
    }
  };
  
  // Conversion des événements analysis-complete en animations de solde
  const handleAnalysisComplete = (event: CustomEvent) => {
    const { gain } = event.detail || {};
    if (typeof gain === 'number' && gain > 0) {
      animateBalanceUpdate(0, gain, () => {});
    }
  };

  window.addEventListener('dashboard:micro-gain', handleMicroGain as EventListener);
  window.addEventListener('analysis-complete', handleAnalysisComplete as EventListener);
  
  // Fonction de nettoyage
  return () => {
    window.removeEventListener('dashboard:micro-gain', handleMicroGain as EventListener);
    window.removeEventListener('analysis-complete', handleAnalysisComplete as EventListener);
  };
};
