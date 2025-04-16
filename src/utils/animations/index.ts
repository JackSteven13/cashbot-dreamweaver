
/**
 * Utilitaires d'animation centralisés pour le tableau de bord
 */

/**
 * Déclenche un événement d'animation sur le tableau de bord
 */
export const triggerDashboardEvent = (
  eventName: 'analysis-start' | 'analysis-complete' | 'activity' | 'balance-update',
  data: any = {}
) => {
  console.log(`Animation event triggered: ${eventName}`, data);
  
  // Créer un événement personnalisé avec les données fournies
  const eventMap: Record<string, string> = {
    'analysis-start': 'dashboard:analysis-start',
    'analysis-complete': 'dashboard:analysis-complete',
    'activity': 'dashboard:activity',
    'balance-update': 'balance:update'
  };
  
  const customEventName = eventMap[eventName] || `dashboard:${eventName}`;
  
  try {
    window.dispatchEvent(new CustomEvent(customEventName, {
      detail: {
        ...data,
        timestamp: Date.now()
      }
    }));
    
    // Pour certains événements, déclencher également des animations visuelles
    if (eventName === 'analysis-start') {
      window.dispatchEvent(new CustomEvent('terminal:show', {
        detail: {
          lines: [{text: "Démarrage de l'analyse...", type: 'info'}],
          isComplete: false
        }
      }));
    }
    
    if (eventName === 'analysis-complete' && data.gain > 0) {
      // Déclencher un événement d'animation pour le solde
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: { amount: data.gain, animate: true }
      }));
    }
  } catch (error) {
    console.error(`Erreur lors du déclenchement de l'événement ${eventName}:`, error);
  }
};

/**
 * Simule une activité aléatoire sur le tableau de bord
 */
export const simulateActivity = (count: number = 5, interval: number = 8000) => {
  let counter = 0;
  
  const simulate = () => {
    if (counter >= count) return;
    
    const eventTypes = ['activity', 'micro-gain'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    console.log(`Dashboard event triggered: ${eventType}`);
    
    if (eventType === 'micro-gain') {
      const gain = parseFloat((Math.random() * 0.05 + 0.01).toFixed(2));
      
      window.dispatchEvent(new CustomEvent('balance:micro-update', {
        detail: { amount: gain, animate: false }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('dashboard:activity', {
        detail: { level: Math.random() * 100, timestamp: Date.now() }
      }));
    }
    
    counter++;
    
    // Planifier le prochain événement
    const nextInterval = interval * (0.5 + Math.random());
    setTimeout(simulate, nextInterval);
  };
  
  // Démarrer la simulation
  setTimeout(simulate, interval);
};
