
/**
 * Centralized event dispatcher for dashboard animations
 */
export const triggerDashboardEvent = (
  eventName: string, 
  data: Record<string, any> = {},
  options: { debounce?: number; background?: boolean } = {}
) => {
  // Skip triggering loading events if background is true
  if ((data.background || options.background) && (eventName === 'analysis-start' || eventName === 'loading-start')) {
    console.log(`Skipping loading screen for background ${eventName} event`);
    return;
  }
  
  // Create and dispatch a custom event
  const event = new CustomEvent(`dashboard:${eventName}`, {
    detail: {
      ...data,
      timestamp: Date.now(),
      background: options.background || data.background,
      noEffects: data.noEffects || true // Désactiver par défaut les effets excessifs
    }
  });
  
  // Dispatch with optional debouncing
  if (options.debounce) {
    setTimeout(() => {
      window.dispatchEvent(event);
    }, options.debounce);
  } else {
    window.dispatchEvent(event);
  }
  
  console.log(`Dashboard event triggered: ${eventName}`);
};
