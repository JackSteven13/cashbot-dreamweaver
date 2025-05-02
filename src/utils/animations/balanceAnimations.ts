
/**
 * Animate balance update with counting effect
 * @param startValue Initial value
 * @param endValue Final value
 * @param duration Animation duration in ms
 * @param updateCallback Callback to update UI
 * @param easingFunction Optional easing function
 * @param completeCallback Optional callback on animation completion
 */
export const animateBalanceUpdate = (
  startValue: number,
  endValue: number,
  duration = 1000,
  updateCallback: (value: number) => void,
  easingFunction?: (t: number) => number,
  completeCallback?: () => void
) => {
  const startTime = Date.now();
  
  // Default linear easing if none provided
  const easing = easingFunction || ((t) => t);
  
  const animate = () => {
    const now = Date.now();
    const elapsed = now - startTime;
    
    if (elapsed < duration) {
      const progress = easing(Math.min(elapsed / duration, 1));
      const currentValue = startValue + (endValue - startValue) * progress;
      updateCallback(currentValue);
      requestAnimationFrame(animate);
    } else {
      updateCallback(endValue);
      
      // Trigger balance animation complete event
      window.dispatchEvent(new CustomEvent('balance:animation-complete', {
        detail: { finalValue: endValue }
      }));
      
      // Call complete callback if provided
      if (completeCallback) {
        completeCallback();
      }
    }
  };
  
  requestAnimationFrame(animate);
  
  // Also trigger a balance:update event for other components to respond
  window.dispatchEvent(new CustomEvent('balance:update', {
    detail: {
      startValue,
      endValue,
      amount: endValue - startValue,
      animate: true,
      duration
    }
  }));
};

/**
 * Sets up balance animation event listeners
 */
export const setupBalanceAnimations = (): () => void => {
  // Conversion des événements dashboard:micro-gain en animations de solde
  const handleMicroGain = (event: CustomEvent) => {
    const { amount } = event.detail || {};
    if (typeof amount === 'number' && amount > 0) {
      animateBalanceUpdate(0, amount, 1000, () => {});
    }
  };
  
  // Conversion des événements analysis-complete en animations de solde
  const handleAnalysisComplete = (event: CustomEvent) => {
    const { gain } = event.detail || {};
    if (typeof gain === 'number' && gain > 0) {
      animateBalanceUpdate(0, gain, 1000, () => {});
    }
  };

  window.addEventListener('dashboard:micro-gain', handleMicroGain as EventListener);
  window.addEventListener('analysis-complete', handleAnalysisComplete as EventListener);
  
  // Fonction de nettoyage
  return () => {
    window.removeEventListener('dashboard:micro-gain', handleMicroGain as EventListener);
    window.removeEventListener('analysis-complete', handleAnalysisComplete as EventListener);
  };
};
