
/**
 * Creates money particle effects around an element
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
  
  // Create money particles
  for (let i = 0; i < count; i++) {
    // Create a new particle element
    const particle = document.createElement('div');
    particle.className = 'money-particle';
    
    // Use "€" symbol for a professional look
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
