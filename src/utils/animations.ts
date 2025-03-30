
import confetti from 'canvas-confetti';

/**
 * Crée un effet de particules de monnaie lorsque l'utilisateur gagne de l'argent
 * @param element L'élément à partir duquel créer les particules
 * @param particleCount Nombre de particules à créer
 */
export const createMoneyParticles = (element: HTMLElement, particleCount: number = 20) => {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // Créer les éléments de particule
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    
    // Choix aléatoire entre symbole € et symbole de monnaie 💰
    const symbol = Math.random() > 0.6 ? '€' : '💰';
    
    // Appliquer le style de la particule
    particle.textContent = symbol;
    particle.style.position = 'fixed';
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    particle.style.fontSize = symbol === '€' ? `${Math.random() * 10 + 14}px` : `${Math.random() * 10 + 18}px`;
    particle.style.color = symbol === '€' ? '#9b87f5' : 'inherit';
    particle.style.fontWeight = 'bold';
    particle.style.zIndex = '9999';
    particle.style.pointerEvents = 'none';
    particle.classList.add('money-particle');
    
    // Définir la destination aléatoire
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 100 + 50;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    const rotation = Math.random() * 360;
    
    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.setProperty('--r', `${rotation}deg`);
    
    // Ajouter au DOM et supprimer après l'animation
    document.body.appendChild(particle);
    
    setTimeout(() => {
      document.body.removeChild(particle);
    }, 1500);
  }
  
  // Créer un effet confetti pour les gros gains
  if (particleCount > 10) {
    const colors = ['#9b87f5', '#f97316', '#22c55e'];
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { 
        x: centerX / window.innerWidth, 
        y: centerY / window.innerHeight 
      },
      colors: colors,
      shapes: ['circle', 'square'],
      scalar: 0.7
    });
  }
};

/**
 * Ajoute une animation de pulsation au solde lorsqu'il est mis à jour
 * @param element L'élément contenant le solde
 * @param amount Le montant ajouté (pour déterminer l'intensité)
 */
export const animateBalanceUpdate = (element: HTMLElement, amount: number) => {
  // Vérifier si l'élément existe
  if (!element) return;
  
  // Créer un nouvel élément pour afficher l'augmentation
  const increase = document.createElement('span');
  increase.textContent = `+${amount.toFixed(2)}€`;
  increase.className = 'absolute -top-6 right-0 text-green-500 font-bold text-lg balance-increase';
  
  // Ajouter l'élément au DOM
  element.style.position = 'relative';
  element.appendChild(increase);
  
  // Ajouter une classe pour l'animation de pulsation
  element.classList.add('pulse-animation');
  
  // Supprimer l'animation après un délai
  setTimeout(() => {
    element.removeChild(increase);
    element.classList.remove('pulse-animation');
  }, 3000);
};

/**
 * Déclenche un événement d'animation sur le dashboard
 * @param type Le type d'événement (session, balance, etc.)
 * @param data Les données associées à l'événement
 */
export const triggerDashboardEvent = (type: string, data?: any) => {
  const event = new CustomEvent(`dashboard:${type}`, { 
    detail: data 
  });
  
  window.dispatchEvent(event);
};
