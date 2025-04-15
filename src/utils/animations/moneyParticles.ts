
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
