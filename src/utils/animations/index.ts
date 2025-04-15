
import { createMoneyParticles } from './moneyParticles';
import { toast } from '@/components/ui/use-toast';

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
        createMoneyParticles(el, 5);
        
        setTimeout(() => {
          el.classList.remove('glow-effect');
        }, 3000);
      }
    });
  }
};

// Animation utility for balance updates
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
