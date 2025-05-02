
/**
 * Creates money particle effects around a button or element
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
  
  // Create money particles with improved styling
  for (let i = 0; i < count; i++) {
    // Create a new particle element
    const particle = document.createElement('div');
    particle.className = 'money-particle';
    
    // Use "€" instead of emoji for more professional look
    particle.textContent = '€';
    
    // Calculate random positions and movements
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 100;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    const rotation = -30 + Math.random() * 60;
    const scale = 0.8 + Math.random() * 1;
    
    // Position the particle at the starting point
    particle.style.position = 'fixed'; // Use fixed instead of absolute for better positioning
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    particle.style.fontSize = `${14 + Math.random() * 10}px`;
    particle.style.fontWeight = 'bold';
    particle.style.opacity = '0.9';
    particle.style.color = '#00783E'; // Professional green color
    particle.style.zIndex = '9999';
    particle.style.pointerEvents = 'none';
    particle.style.textShadow = '0 0 3px rgba(255,255,255,0.7)';
    particle.style.transition = 'all 1.5s cubic-bezier(0.165, 0.84, 0.44, 1)';
    
    // Animate the particle
    setTimeout(() => {
      particle.style.transform = `translate(${tx}px, ${ty}px) rotate(${rotation}deg) scale(${scale})`;
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
  
  // Add a CSS animation class to the element
  element.classList.add('balance-updated');
  
  // Remove the class after animation completes
  setTimeout(() => {
    element.classList.remove('balance-updated');
  }, 1000);
};
