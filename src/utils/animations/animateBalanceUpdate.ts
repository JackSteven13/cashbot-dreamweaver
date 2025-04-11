
/**
 * Fonction pour animer une mise à jour de solde avec une transition fluide
 * 
 * @param startValue Valeur de départ
 * @param endValue Valeur finale
 * @param duration Durée de l'animation en ms
 * @param onUpdate Fonction appelée à chaque frame avec la valeur actuelle
 * @param easingFn Fonction d'easing (optionnelle)
 * @param onComplete Fonction appelée quand l'animation est terminée
 */
export const animateBalanceUpdate = (
  startValue: number,
  endValue: number,
  duration: number = 1000,
  onUpdate: (value: number) => void,
  easingFn: (t: number) => number = (t) => t,
  onComplete?: () => void
): void => {
  // Validation des inputs
  if (typeof startValue !== 'number' || typeof endValue !== 'number') {
    console.error('animateBalanceUpdate: startValue and endValue must be numbers');
    return;
  }

  // Si les valeurs sont égales, inutile d'animer
  if (startValue === endValue) {
    onUpdate(endValue);
    if (onComplete) onComplete();
    return;
  }

  // Variables de contrôle
  const difference = endValue - startValue;
  const startTime = Date.now();
  
  // Fonction d'animation récursive
  const animate = () => {
    // Calculer la progression (0 à 1)
    const elapsedTime = Date.now() - startTime;
    let progress = Math.min(elapsedTime / duration, 1);
    
    // Appliquer la fonction d'easing
    progress = easingFn(progress);
    
    // Calculer la valeur actuelle
    const currentValue = startValue + difference * progress;
    
    // Appeler le callback avec la valeur arrondie à 2 décimales pour éviter les nombres flottants excessifs
    const roundedValue = Math.round(currentValue * 100) / 100;
    onUpdate(roundedValue);
    
    // Continuer l'animation si pas terminée
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Animation terminée, s'assurer que la valeur finale est exacte
      onUpdate(endValue);
      if (onComplete) onComplete();
    }
  };
  
  // Lancer l'animation
  requestAnimationFrame(animate);
};

/**
 * Émet un événement pour créer des particules de monnaie autour d'un élément
 * @param element Élément autour duquel créer les particules
 * @param amount Nombre de particules (défaut: 10)
 */
export const createMoneyParticles = (element: HTMLElement, amount: number = 10) => {
  // Vérifier si les particules sont désactivées
  const disableParticles = localStorage.getItem('disableBalanceParticles') === 'true';
  if (disableParticles) return;
  
  // Créer un événement personnalisé avec plus d'informations
  const rect = element.getBoundingClientRect();
  window.dispatchEvent(
    new CustomEvent('dashboard:animation', {
      detail: {
        type: 'money-particles',
        element,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        },
        amount
      }
    })
  );
};

export default animateBalanceUpdate;
