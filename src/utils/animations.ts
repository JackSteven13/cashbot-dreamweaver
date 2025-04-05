
/**
 * Centralized event dispatcher for dashboard animations
 */
export const triggerDashboardEvent = (
  eventName: string, 
  data: Record<string, any> = {},
  options: { debounce?: number; background?: boolean } = {}
) => {
  // Skip triggering loading events if background is true
  if (data.background && (eventName === 'analysis-start' || eventName === 'loading-start')) {
    console.log(`Skipping loading screen for background ${eventName} event`);
    return;
  }
  
  // Create and dispatch a custom event
  const event = new CustomEvent(`dashboard:${eventName}`, {
    detail: {
      ...data,
      timestamp: Date.now(),
      background: options.background || data.background
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
 * Create money particle animation
 * @param element Element to create particles from
 * @param count Number of particles to create
 */
export const createMoneyParticles = (element: HTMLElement, count = 10) => {
  if (!element) return;
  
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.innerHTML = ["💵", "💰", "💸", "€"][Math.floor(Math.random() * 4)];
    particle.className = "money-particle";
    particle.style.position = "fixed";
    particle.style.zIndex = "9999";
    particle.style.top = `${centerY}px`;
    particle.style.left = `${centerX}px`;
    particle.style.fontSize = `${Math.random() * 10 + 14}px`;
    particle.style.pointerEvents = "none";
    document.body.appendChild(particle);
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 150 + 50;
    const xVelocity = Math.cos(angle) * velocity;
    const yVelocity = Math.sin(angle) * velocity;
    
    let posX = centerX;
    let posY = centerY;
    let opacity = 1;
    let scale = 1;
    
    const animate = () => {
      posX += xVelocity / 10;
      posY += yVelocity / 10;
      opacity -= 0.02;
      scale += 0.01;
      
      if (opacity <= 0) {
        document.body.removeChild(particle);
        return;
      }
      
      particle.style.left = `${posX}px`;
      particle.style.top = `${posY}px`;
      particle.style.opacity = String(opacity);
      particle.style.transform = `scale(${scale})`;
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }
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
