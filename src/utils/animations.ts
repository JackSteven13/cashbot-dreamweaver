
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

/**
 * Animate balance update with counting effect
 * @param startValue Initial value
 * @param endValue Final value
 * @param duration Animation duration in ms
 * @param updateCallback Callback to update UI
 */
export const animateBalanceUpdate = (
  startValue: number,
  endValue: number,
  duration = 1000,
  updateCallback: (value: number) => void
) => {
  const startTime = Date.now();
  
  const animate = () => {
    const now = Date.now();
    const elapsed = now - startTime;
    
    if (elapsed < duration) {
      const progress = elapsed / duration;
      const currentValue = startValue + (endValue - startValue) * progress;
      updateCallback(currentValue);
      requestAnimationFrame(animate);
    } else {
      updateCallback(endValue);
    }
  };
  
  requestAnimationFrame(animate);
};
