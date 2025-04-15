
/**
 * Simule une activité visuelle sur le dashboard pour améliorer l'expérience utilisateur
 */
export const simulateActivity = (): void => {
  try {
    // Envoyer un événement personnalisé pour déclencher des animations
    window.dispatchEvent(new CustomEvent('dashboard:activity', { 
      detail: { timestamp: Date.now() } 
    }));
    
    // Déclencher l'animation de particules si elle existe
    const triggerParticles = () => {
      try {
        const dashboardEl = document.querySelector('.dashboard-metrics');
        if (dashboardEl) {
          dashboardEl.classList.add('animate-pulse');
          setTimeout(() => {
            dashboardEl.classList.remove('animate-pulse');
          }, 1000);
        }
      } catch (e) {
        console.error("Erreur d'animation:", e);
      }
    };
    
    // Exécuter avec un petit délai
    setTimeout(triggerParticles, 100);
  } catch (e) {
    // Ignorer silencieusement les erreurs d'animation
    console.log("Animation ignorée:", e);
  }
};

/**
 * Crée un effet de particules d'argent pour célébrer un gain
 */
export const createMoneyParticles = (amount: number): void => {
  try {
    console.log(`Animation de particules pour ${amount}€`);
    // Cette fonction sera implémentée avec des animations plus élaborées dans le futur
  } catch (e) {
    console.error("Erreur lors de la création des particules:", e);
  }
};

/**
 * Anime la mise à jour du solde avec un effet visuel
 */
export const flashBalanceUpdate = (element: HTMLElement | null, amount: number): void => {
  if (!element) return;
  
  try {
    const className = amount >= 0 ? 'flash-green' : 'flash-red';
    element.classList.add(className);
    
    setTimeout(() => {
      element.classList.remove(className);
    }, 1000);
  } catch (e) {
    console.error("Erreur lors de l'animation du solde:", e);
  }
};
