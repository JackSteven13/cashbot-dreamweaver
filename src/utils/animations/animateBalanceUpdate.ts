
/**
 * Animates the balance update for a smoother user experience
 * @param startValue Starting balance value
 * @param endValue Target balance value
 * @param duration Animation duration in milliseconds
 * @param updateCallback Function to update the UI during animation
 * @param easingFunction Optional easing function
 * @param onComplete Optional callback when animation completes
 */
export const animateBalanceUpdate = (
  startValue: number,
  endValue: number,
  duration: number = 1000,
  updateCallback: (value: number) => void,
  easingFunction: ((t: number) => number) | undefined = undefined,
  onComplete?: () => void
): void => {
  // Default easing function (easeOutCubic for smooth deceleration)
  const defaultEasing = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };

  const easing = easingFunction || defaultEasing;
  const startTime = performance.now();
  const difference = endValue - startValue;

  // Add money particles effect
  if (Math.abs(difference) > 0.01) {
    createMoneyParticles(difference > 0);
  }

  // Animation function
  const animate = (currentTime: number): void => {
    let elapsed = currentTime - startTime;
    
    // Ensure we don't exceed duration
    elapsed = Math.min(elapsed, duration);
    
    // Calculate progress (0 to 1)
    const progress = elapsed / duration;
    
    // Apply easing
    const easedProgress = easing(progress);
    
    // Calculate current value
    const currentValue = startValue + difference * easedProgress;
    
    // Update the UI
    updateCallback(currentValue);
    
    // Continue animation if not complete
    if (elapsed < duration) {
      requestAnimationFrame(animate);
    } else {
      // Ensure final value is exact
      updateCallback(endValue);
      
      // Call completion callback if provided
      if (onComplete) {
        onComplete();
      }
    }
  };

  // Start animation
  requestAnimationFrame(animate);
};

/**
 * Creates money particle effects for balance updates
 */
const createMoneyParticles = (isPositive: boolean = true): void => {
  // Number of particles to create
  const particleCount = isPositive ? 8 : 4;
  
  // Get balance display element
  const balanceElement = document.querySelector('.balance-display');
  if (!balanceElement) return;
  
  // Get position for particles
  const rect = balanceElement.getBoundingClientRect();
  const startX = rect.left + rect.width * 0.75;
  const startY = rect.top + rect.height * 0.5;
  
  // Create particles
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    
    // Set particle content
    particle.textContent = isPositive ? '+' : '-';
    particle.className = 'money-particle';
    
    // Random position and movement
    const angle = (Math.random() * Math.PI * 2);
    const distance = 50 + Math.random() * 100;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 50; // Bias upward
    
    // Set random transform variables
    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    
    // Style based on positive/negative
    if (isPositive) {
      particle.style.color = '#4ade80'; // Green for positive
    } else {
      particle.style.color = '#f87171'; // Red for negative
    }
    
    // Position and append
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    document.body.appendChild(particle);
    
    // Remove after animation completes
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 1500);
  }
};
