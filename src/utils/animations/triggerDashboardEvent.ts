
/**
 * Utilitaire pour déclencher des événements dans le dashboard
 */

/**
 * Type d'événements disponibles
 */
type DashboardEventType = 
  | 'analysis-start' 
  | 'analysis-complete' 
  | 'session-start'
  | 'session-complete'
  | 'limit-reached'
  | 'activity'
  | 'terminal-update';

/**
 * Déclenche un événement dans le dashboard
 */
export const triggerDashboardEvent = (
  eventType: DashboardEventType, 
  data: Record<string, any> = {}
): void => {
  window.dispatchEvent(new CustomEvent(`dashboard:${eventType}`, { 
    detail: { ...data, timestamp: Date.now() } 
  }));
  
  // Journaliser l'événement pour le débogage
  console.log(`[Dashboard Event] ${eventType}`, data);
};

/**
 * Déclenche un événement d'activité dans le dashboard
 * @param level Niveau d'activité ('low', 'medium', 'high')
 */
export const triggerActivityEvent = (
  level: 'low' | 'medium' | 'high' = 'medium'
): void => {
  triggerDashboardEvent('activity', { level });
};

/**
 * Déclenche un événement de terminal dans le dashboard
 */
export const updateTerminal = (
  line: string,
  options: { background?: boolean; animate?: boolean } = {}
): void => {
  triggerDashboardEvent('terminal-update', {
    line,
    ...options
  });
};

export default triggerDashboardEvent;
