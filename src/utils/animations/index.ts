
/**
 * Utilitaires d'animations centralisés
 */

/**
 * Crée des particules de monnaie autour d'un élément
 */
export function createMoneyParticles(element: HTMLElement, count: number = 10): void {
  if (!element) return;
  
  console.log(`Creating ${count} money particles around element`, element);
  
  const elementRect = element.getBoundingClientRect();
  const centerX = elementRect.left + elementRect.width / 2;
  const centerY = elementRect.top + elementRect.height / 2;
  
  for (let i = 0; i < count; i++) {
    // Créer un élément pour représenter une particule
    const particle = document.createElement('div');
    
    // Appliquer des styles
    particle.className = 'money-particle fixed';
    
    // Styles CSS inline pour la particule
    const particleStyle = {
      position: 'fixed',
      width: `${Math.random() * 10 + 10}px`, // Taille aléatoire entre 10-20px
      height: `${Math.random() * 10 + 10}px`,
      backgroundColor: getRandomColor(),
      borderRadius: '50%', // Circulaire
      pointerEvents: 'none',
      zIndex: '9999',
      opacity: '0.8',
      boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
      transform: 'scale(0)'
    };
    
    // Appliquer les styles à l'élément
    Object.assign(particle.style, particleStyle);
    
    // Positionner la particule au centre de l'élément
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    
    // Ajouter la particule au DOM
    document.body.appendChild(particle);
    
    // Animer la particule
    setTimeout(() => {
      // Angle aléatoire pour la dispersion
      const angle = Math.random() * Math.PI * 2;
      // Distance aléatoire entre 50-200px
      const distance = Math.random() * 150 + 50;
      
      // Calculer position finale
      const finalX = centerX + Math.cos(angle) * distance;
      const finalY = centerY + Math.sin(angle) * distance;
      
      // Appliquer animation avec styles
      particle.style.transition = 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      particle.style.transform = 'scale(1)';
      particle.style.left = `${finalX}px`;
      particle.style.top = `${finalY}px`;
      
      // Supprimer après l'animation
      setTimeout(() => {
        particle.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(particle);
        }, 500);
      }, 800);
    }, Math.random() * 200); // Départ légèrement décalé
  }
}

/**
 * Génère une couleur aléatoire dans la palette verte/bleue/jaune
 */
function getRandomColor(): string {
  const colors = [
    '#4CAF50', // Vert
    '#8BC34A', // Vert clair
    '#FFC107', // Jaune
    '#FFEB3B', // Jaune clair
    '#2196F3', // Bleu
    '#03A9F4', // Bleu clair
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Animer une valeur numérique avec interpolation
 */
export function animateNumber(
  element: HTMLElement,
  startValue: number,
  endValue: number,
  duration: number = 1000,
  prefix: string = '',
  suffix: string = '',
  decimals: number = 2
): void {
  if (!element) return;

  const startTime = performance.now();
  const change = endValue - startValue;

  const animate = (currentTime: number) => {
    const elapsedTime = currentTime - startTime;
    let progress = Math.min(elapsedTime / duration, 1);
    
    // Fonction d'atténuation pour un mouvement plus naturel
    progress = easeOutCubic(progress);
    
    // Calculer la valeur actuelle
    const currentValue = startValue + change * progress;
    
    // Mettre à jour le contenu de l'élément
    element.textContent = `${prefix}${currentValue.toFixed(decimals)}${suffix}`;
    
    // Continuer l'animation si elle n'est pas terminée
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

// Fonction d'atténuation pour rendre l'animation plus naturelle
function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Simule une activité sur le dashboard
 */
export function simulateActivity() {
  // Crée un point d'activité à une position aléatoire sur l'écran
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight * 0.7 + window.innerHeight * 0.1;
  
  // Créer un élément pour le point d'activité
  const activityPoint = document.createElement('div');
  
  // Styles pour le point d'activité
  activityPoint.className = 'activity-point fixed';
  
  Object.assign(activityPoint.style, {
    position: 'fixed',
    width: '8px',
    height: '8px',
    backgroundColor: '#4CAF50',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: '9999',
    opacity: '0',
    boxShadow: '0 0 10px rgba(76, 175, 80, 0.8)',
    left: `${x}px`,
    top: `${y}px`,
    transform: 'scale(0)'
  });
  
  // Ajouter au DOM
  document.body.appendChild(activityPoint);
  
  // Animer l'apparition
  setTimeout(() => {
    activityPoint.style.transition = 'all 0.3s ease-out';
    activityPoint.style.opacity = '1';
    activityPoint.style.transform = 'scale(1)';
    
    // Pulse effect
    setTimeout(() => {
      activityPoint.style.transform = 'scale(1.5)';
      activityPoint.style.opacity = '0.7';
      
      setTimeout(() => {
        activityPoint.style.transform = 'scale(0)';
        activityPoint.style.opacity = '0';
        
        // Supprimer après l'animation
        setTimeout(() => {
          document.body.removeChild(activityPoint);
        }, 300);
      }, 300);
    }, 300);
  }, 100);
}
