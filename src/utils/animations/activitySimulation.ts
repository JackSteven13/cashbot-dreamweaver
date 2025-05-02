
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
    window.dispatchEvent(new CustomEvent('dashboard:micro-gain', {
      detail: {
        amount: microGain,
        automatic: true
      }
    }));
    
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
    window.dispatchEvent(new CustomEvent('dashboard:activity', { 
      detail: { timestamp: Date.now() } 
    }));
    
    // 40% chance of generating a micro gain
    if (Math.random() > 0.6) {
      generateMicroGain();
    }
  }, interval);
  
  // Return cleanup function
  return () => clearInterval(activityInterval);
};
