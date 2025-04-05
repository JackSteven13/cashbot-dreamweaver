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
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    particle.style.fontSize = `${12 + Math.random() * 8}px`;
    particle.style.opacity = '0.7';
    particle.style.color = '#00783E'; // Professional green color
    
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
