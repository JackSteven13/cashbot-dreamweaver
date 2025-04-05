
// Export les fonctions d'animations
export { animateBalanceUpdate } from './animateBalanceUpdate';

/**
 * Déclenche un événement du dashboard avec un timeout pour éviter les conflits
 */
export function triggerDashboardEvent(eventType: string, data: any = {}) {
  // Ajouter un léger délai pour éviter les conflits d'événements simultanés
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent(`dashboard:${eventType}`, { detail: data }));
  }, 10);
}

/**
 * Active une animation de disparition sur un élément
 */
export function fadeOutElement(element: HTMLElement, duration: number = 300) {
  if (!element) return;
  
  element.style.transition = `opacity ${duration}ms ease-out`;
  element.style.opacity = '0';
  
  setTimeout(() => {
    if (element.parentElement) {
      element.parentElement.removeChild(element);
    }
  }, duration);
}

/**
 * Crée un événement de mise à jour du solde
 * @param amount - Montant du gain
 * @param currentBalance - Solde actuel après l'ajout du gain
 */
export function createBalanceUpdateEvent(amount: number, currentBalance?: number) {
  return new CustomEvent('balance:update', {
    detail: {
      amount,
      currentBalance
    }
  });
}

/**
 * Fonction pour créer des particules de monnaie lors de gains
 * Version simplifiée et professionnelle
 */
export function createMoneyParticles(element: HTMLElement, amount: number = 1) {
  if (!element) return;
  
  // Nombre de particules basé sur le montant (limité pour rester sobre)
  const particleCount = Math.min(Math.ceil(amount * 5), 15);
  
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';
  container.style.overflow = 'hidden';
  container.style.zIndex = '50';
  
  element.appendChild(container);
  
  // Créer les particules
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    
    // Configurer l'apparence de la particule (€)
    particle.textContent = '€';
    particle.style.position = 'absolute';
    particle.style.color = '#5ee675'; // Vert clair pour le symbole euro
    particle.style.fontSize = `${Math.random() * 10 + 14}px`;
    particle.style.fontWeight = 'bold';
    particle.style.opacity = `${Math.random() * 0.5 + 0.5}`;
    particle.style.zIndex = '51';
    particle.style.pointerEvents = 'none';
    
    // Position de départ (centre de l'élément)
    const startX = element.clientWidth / 2;
    const startY = element.clientHeight / 2;
    
    // Position finale (aléatoire autour de l'élément)
    const endX = startX + (Math.random() - 0.5) * element.clientWidth * 0.8;
    const endY = startY + (Math.random() - 0.5) * element.clientHeight * 1.2;
    
    // Paramètres d'animation
    const duration = 1000 + Math.random() * 1500;
    const delay = Math.random() * 400;
    
    // Configurer les styles initiaux
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    particle.style.transform = 'scale(0.5) rotate(0deg)';
    
    // Ajouter au conteneur
    container.appendChild(particle);
    
    // Animation avec requestAnimationFrame pour de meilleures performances
    const startTime = Date.now() + delay;
    
    const animateParticle = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      if (elapsed < 0) {
        // Pas encore temps de démarrer l'animation
        requestAnimationFrame(animateParticle);
        return;
      }
      
      if (elapsed >= duration) {
        // Animation terminée, nettoyer
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
        
        // Si c'est la dernière particule, supprimer le conteneur
        if (container.childNodes.length === 0) {
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }
        }
        
        return;
      }
      
      // Calculer la progression de l'animation
      const progress = elapsed / duration;
      
      // Courbe d'animation non linéaire pour un effet plus naturel
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      // Calculer la position actuelle
      const currentX = startX + (endX - startX) * easeOutQuart;
      const currentY = startY + (endY - startY) * easeOutQuart - Math.sin(progress * Math.PI) * 30;
      
      // Calculer l'échelle et la rotation
      const scale = 0.5 + progress * 0.5;
      const rotate = progress * (Math.random() > 0.5 ? 360 : -360);
      
      // Calculer l'opacité (disparaît vers la fin)
      const opacity = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1;
      
      // Appliquer les styles
      particle.style.left = `${currentX}px`;
      particle.style.top = `${currentY}px`;
      particle.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
      particle.style.opacity = opacity.toString();
      
      // Continuer l'animation
      requestAnimationFrame(animateParticle);
    };
    
    // Démarrer l'animation
    requestAnimationFrame(animateParticle);
  }
  
  // Auto-nettoyage après la durée maximale possible
  setTimeout(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }, 3000);
}
