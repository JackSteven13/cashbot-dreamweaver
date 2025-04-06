
/**
 * Fonction qui anime une mise à jour de solde entre deux valeurs
 * avec une garantie que la valeur ne diminue jamais
 */
export function animateBalanceUpdate(
  startValue: number,
  endValue: number,
  duration: number,
  onUpdate: (value: number) => void,
  easing: (t: number) => number = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
) {
  // Garantir que l'animation va toujours vers le haut, jamais vers le bas
  if (endValue < startValue) {
    console.warn(`Attempted to animate balance from ${startValue} to lower value ${endValue}. Using starting value instead.`);
    onUpdate(startValue);
    return;
  }
  
  // Si les valeurs sont identiques ou très proches, pas besoin d'animer
  if (Math.abs(endValue - startValue) < 0.001) {
    onUpdate(endValue);
    return;
  }
  
  // Enregistrer le timestamp de départ
  const startTime = performance.now();
  let lastUpdateTime = startTime;
  let lastValue = startValue;
  
  // Fonction d'animation récursive avec limitation de taux de rafraîchissement
  const animate = (currentTime: number) => {
    // Limiter à 30 mises à jour par seconde pour éviter les saccades
    const timeSinceLastUpdate = currentTime - lastUpdateTime;
    if (timeSinceLastUpdate < 33) { // ~30 FPS
      requestAnimationFrame(animate);
      return;
    }
    
    // Mettre à jour le temps de dernière mise à jour
    lastUpdateTime = currentTime;
    
    // Calculer le temps écoulé
    const elapsedTime = currentTime - startTime;
    
    // Calculer la progression (entre 0 et 1)
    let progress = Math.min(elapsedTime / duration, 1);
    
    // Appliquer la fonction d'easing pour une animation plus naturelle
    progress = easing(progress);
    
    // Calculer la valeur actuelle avec 2 décimales max
    const currentValue = parseFloat((startValue + (endValue - startValue) * progress).toFixed(2));
    
    // Ne pas mettre à jour si la valeur est identique à la dernière mise à jour
    // Cela évite les re-rendus inutiles
    if (currentValue !== lastValue) {
      lastValue = currentValue;
      onUpdate(currentValue);
    }
    
    // Continuer l'animation si on n'a pas atteint la fin
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Assurer que la valeur finale est exacte avec 2 décimales
      const finalValue = parseFloat(endValue.toFixed(2));
      if (finalValue !== lastValue) {
        onUpdate(finalValue);
      }
    }
  };
  
  // Démarrer l'animation
  requestAnimationFrame(animate);
}
