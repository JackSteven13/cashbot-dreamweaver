
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
 * Creates subtle money particle effects around a button
 * @param element The DOM element to create particles around
 * @param count Number of particles to create
 */
export const createMoneyParticles = (
  element: HTMLElement,
  count: number = 10
) => {
  // Get element position and dimensions
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // Create subtle money particles
  for (let i = 0; i < count; i++) {
    // Create a new particle element
    const particle = document.createElement('div');
    particle.className = 'money-particle';
    
    // Use "€" instead of emoji for more professional look
    particle.textContent = '€';
    
    // Calculate random positions and movements
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 60;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    const rotation = -30 + Math.random() * 60;
    
    // Set custom properties for the animation
    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.setProperty('--r', `${rotation}deg`);
    
    // Position the particle at the starting point
    particle.style.position = 'absolute';
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    particle.style.fontSize = `${12 + Math.random() * 8}px`;
    particle.style.opacity = '0.7';
    particle.style.color = '#00783E'; // Professional green color
    particle.style.zIndex = '9999';
    particle.style.pointerEvents = 'none';
    particle.style.transition = 'all 1.5s ease-out';
    
    // Animate the particle
    setTimeout(() => {
      particle.style.transform = `translate(${tx}px, ${ty}px) rotate(${rotation}deg)`;
      particle.style.opacity = '0';
    }, 10);
    
    // Add to document
    document.body.appendChild(particle);
    
    // Remove after animation completes
    setTimeout(() => {
      if (document.body.contains(particle)) {
        document.body.removeChild(particle);
      }
    }, 1500);
  }
};

/**
 * Simulates activity with random small balance updates
 */
export const simulateActivity = (options: { intensity?: 'low' | 'medium' | 'high' } = {}) => {
  const { intensity = 'medium' } = options;
  
  // Determine frequency based on intensity
  const intervalMap = {
    low: 90000, // Every 90 seconds
    medium: 45000, // Every 45 seconds
    high: 20000 // Every 20 seconds
  };
  
  const interval = intervalMap[intensity];
  
  // Generate a micro-gain
  const generateMicroGain = () => {
    // Smaller gains for more natural looking progression
    // Range: 0.01-0.03 (low), 0.01-0.05 (medium), 0.02-0.08 (high)
    const gainRanges = {
      low: { min: 0.01, max: 0.03 },
      medium: { min: 0.01, max: 0.05 },
      high: { min: 0.02, max: 0.08 }
    };
    
    const range = gainRanges[intensity];
    const microGain = parseFloat((Math.random() * (range.max - range.min) + range.min).toFixed(2));
    
    // Dispatch event
    triggerDashboardEvent('micro-gain', {
      amount: microGain,
      automatic: true
    });
    
    // Also trigger a balance update event
    window.dispatchEvent(new CustomEvent('balance:update', {
      detail: {
        amount: microGain,
        animate: true,
        automatic: true
      }
    }));
  };
  
  // Initial activity
  generateMicroGain();
  
  // Set up interval for regular activity
  const activityInterval = setInterval(() => {
    triggerDashboardEvent('activity');
    
    // 40% chance of generating a micro gain
    if (Math.random() > 0.6) {
      generateMicroGain();
    }
  }, interval);
  
  // Return cleanup function
  return () => clearInterval(activityInterval);
};

