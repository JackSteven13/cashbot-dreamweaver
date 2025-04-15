
import { toast } from '@/components/ui/use-toast';

/**
 * Crée des particules d'argent animées autour d'un élément cible
 */
export const createMoneyParticles = (targetElement: HTMLElement, count: number = 5) => {
  const rect = targetElement.getBoundingClientRect();
  
  // Créer les particules
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'money-particle';
    particle.textContent = '€';
    
    // Position aléatoire autour de l'élément cible
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Variables CSS pour l'animation
    particle.style.setProperty('--tx', `${Math.random() * 80 - 40}px`);
    particle.style.setProperty('--ty', `${Math.random() * 100 + 50}px`);
    particle.style.setProperty('--r', `${Math.random() * 180 - 90}deg`);
    
    // Positionner la particule
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    // Ajouter au body et supprimer après l'animation
    document.body.appendChild(particle);
    setTimeout(() => {
      particle.remove();
    }, 1500);
  }
};

/**
 * Applique un effet visuel à une mise à jour de solde
 */
export const flashBalanceUpdate = (element: HTMLElement) => {
  element.classList.add('flash-success');
  
  // Ajouter l'élément d'incrément
  const increment = document.createElement('div');
  increment.className = 'balance-increment';
  increment.textContent = '+';
  element.appendChild(increment);
  
  // Animation de rotation de pièce sur l'élément
  const amount = document.createElement('span');
  amount.className = 'coin-animation';
  amount.textContent = '€';
  element.appendChild(amount);
  
  // Nettoyer après l'animation
  setTimeout(() => {
    element.classList.remove('flash-success');
    increment.remove();
    amount.remove();
  }, 2000);
};

/**
 * Simule une activité sur le dashboard avec des effets visuels
 */
export const simulateActivity = () => {
  // Trouver des éléments pour l'animation
  const elements = document.querySelectorAll('.activity-indicator');
  
  // Animer les indicateurs d'activité
  elements.forEach(el => {
    if (el instanceof HTMLElement) {
      el.classList.add('active');
      
      // Désactiver après un délai aléatoire
      setTimeout(() => {
        el.classList.remove('active');
      }, 2000 + Math.random() * 3000);
    }
  });
  
  // Afficher un toast subtil pour renforcer l'effet d'activité
  const messages = [
    "Agent IA actif",
    "Analyse en cours",
    "Données synchronisées",
    "Session active"
  ];
  
  // 30% de chance d'afficher un toast
  if (Math.random() > 0.7) {
    toast({
      title: messages[Math.floor(Math.random() * messages.length)],
      variant: "default",
      duration: 2000,
    });
  }
};
