
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
  
  // Si les valeurs sont identiques, pas besoin d'animer
  if (Math.abs(endValue - startValue) < 0.01) {
    onUpdate(endValue);
    return;
  }
  
  // Enregistrer le timestamp de départ
  const startTime = performance.now();
  
  // Fonction d'animation récursive
  const animate = (currentTime: number) => {
    // Calculer le temps écoulé
    const elapsedTime = currentTime - startTime;
    
    // Calculer la progression (entre 0 et 1)
    let progress = Math.min(elapsedTime / duration, 1);
    
    // Appliquer la fonction d'easing
    progress = easing(progress);
    
    // Calculer la valeur actuelle
    const currentValue = startValue + (endValue - startValue) * progress;
    
    // Appeler le callback avec la valeur actuelle
    onUpdate(currentValue);
    
    // Continuer l'animation si on n'a pas atteint la fin
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Assurer que la valeur finale est exacte
      onUpdate(endValue);
    }
  };
  
  // Démarrer l'animation
  requestAnimationFrame(animate);
}
