
import { createMoneyParticles, flashBalanceUpdate, simulateActivity } from './moneyParticles';
import { toast } from '@/components/ui/use-toast';

/**
 * Centralized event dispatcher for dashboard animations with improved feedback
 */
export const triggerDashboardEvent = (
  eventName: string, 
  data: Record<string, any> = {},
  options: { debounce?: number; background?: boolean } = {}
) => {
  // Skip loading screen if background mode
  if (data.background || options.background) {
    console.log(`Using background mode for ${eventName}`);
    data.noEffects = true;
  }
  
  // Create and dispatch event with animations
  const event = new CustomEvent(`dashboard:${eventName}`, {
    detail: {
      ...data,
      timestamp: Date.now(),
      animate: data.animate !== false
    }
  });
  
  if (options.debounce) {
    setTimeout(() => {
      window.dispatchEvent(event);
    }, options.debounce);
  } else {
    window.dispatchEvent(event);
  }
  
  // Add visual feedback for specific events
  if (eventName === 'analysis-complete' && data.gain) {
    const elements = document.querySelectorAll('.balance-display');
    elements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.classList.add('glow-effect');
        createMoneyParticles(Number(data.gain));
        flashBalanceUpdate(el, Number(data.gain));
        
        setTimeout(() => {
          el.classList.remove('glow-effect');
        }, 3000);
      }
    });
    
    // Show a toast notification for the gain
    toast({
      title: "Revenus générés",
      description: `Vous avez gagné ${data.gain.toFixed(2)}€ avec cette analyse`,
      className: "toast-notification",
    });
    
    // Simulate some activity
    simulateActivity();
  } else if (eventName === 'analysis-start') {
    // Show a toast notification for the analysis start
    toast({
      title: "Analyse en cours",
      description: "Les agents IA analysent les publicités...",
      className: "toast-notification",
    });
  }
};

/**
 * Animation utility for balance updates with improved easing
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
      // Using easeOutQuart for smoother animation
      const progress = elapsed / duration;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;
      
      updateCallback(currentValue);
      requestAnimationFrame(animate);
    } else {
      updateCallback(endValue);
    }
  };
  
  requestAnimationFrame(animate);
};

// Re-export the moneyParticles functions for direct use
export { createMoneyParticles, flashBalanceUpdate, simulateActivity };
