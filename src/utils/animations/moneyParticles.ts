
/**
 * Creates money particle effects around an element
 * @param element The DOM element to create particles around
 * @param count Number of particles to create
 */
export const createMoneyParticles = (
  element: HTMLElement | null,
  count: number = 10
) => {
  if (!element) {
    console.warn("Money particles: No element provided");
    return;
  }
  
  // Get element position and dimensions
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // Array of currency symbols to use randomly
  const currencySymbols = ["€", "+", "💰", "✓"];
  
  // Create money particles
  for (let i = 0; i < count; i++) {
    // Create a new particle element
    const particle = document.createElement('div');
    particle.className = 'money-particle';
    
    // Randomly select a symbol
    const symbolIndex = Math.floor(Math.random() * currencySymbols.length);
    particle.textContent = currencySymbols[symbolIndex];
    
    // Calculate random positions and movements
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 80;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance * 1.5; // Make vertical movement more pronounced
    const rotation = -45 + Math.random() * 90;
    
    // Set custom properties for the animation
    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.setProperty('--r', `${rotation}deg`);
    
    // Position the particle at the starting point
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    particle.style.fontSize = `${14 + Math.random() * 10}px`;
    particle.style.opacity = '0.9';
    
    // Add to document
    document.body.appendChild(particle);
    
    // Remove after animation completes
    setTimeout(() => {
      if (document.body.contains(particle)) {
        document.body.removeChild(particle);
      }
    }, 1500);
  }
  
  // Also add a single balance increment indicator
  const incrementIndicator = document.createElement('div');
  incrementIndicator.className = 'balance-increment';
  incrementIndicator.textContent = '+0.01€';
  
  // Position the increment indicator
  incrementIndicator.style.left = `${rect.left + rect.width / 2}px`;
  incrementIndicator.style.top = `${rect.top}px`;
  
  // Add to document
  document.body.appendChild(incrementIndicator);
  
  // Remove after animation completes
  setTimeout(() => {
    if (document.body.contains(incrementIndicator)) {
      document.body.removeChild(incrementIndicator);
    }
  }, 2000);
};

/**
 * Displays a flash animation on the balance element
 * @param element The element to flash
 */
export const flashBalanceUpdate = (element: HTMLElement | null) => {
  if (!element) return;
  
  element.classList.add('flash-success');
  
  setTimeout(() => {
    element.classList.remove('flash-success');
  }, 800);
};

/**
 * Creates a simulated activity effect for dashboard
 */
export const simulateActivity = () => {
  // Find all activity indicators
  const indicators = document.querySelectorAll('.activity-indicator');
  
  indicators.forEach((indicator, index) => {
    // Random activity simulation
    setTimeout(() => {
      if (Math.random() > 0.5) {
        indicator.classList.add('active');
        setTimeout(() => {
          indicator.classList.remove('active');
        }, 500 + Math.random() * 1000);
      }
    }, index * 300);
  });
};
