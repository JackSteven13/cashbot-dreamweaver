
export const calculateInitialValues = (dailyAdsTarget: number, dailyRevenueTarget: number) => {
  // Get current hour (0-23)
  const currentHour = new Date().getHours();
  
  // Generate much more random base values with extreme variation
  const minBaseAds = 50 + Math.floor(Math.random() * 550); // Massive variation (50-600)
  const minBaseRevenue = 80 + Math.floor(Math.random() * 720); // Massive variation (80-800)
  
  // Much wider dynamic base percentage (10% to 35%)
  const basePercentage = 0.10 + (Math.random() * 0.25);
  
  // Add complex non-linear progression based on hour with chaotic patterns
  let hourlyProgressPercent = 0;
  
  if (currentHour >= 8 && currentHour <= 23) {
    // Active hours (8h-23h) with much more dynamic progression
    // Create irregular peaks throughout the day
    const highPeakHours = [10, 11, 15, 20]; // Major peaks
    const mediumPeakHours = [9, 13, 14, 16, 19, 22]; // Medium peaks
    const lowPeakHours = [8, 12, 17, 18, 21, 23]; // Minor peaks
    
    let peakMultiplier = 1;
    if (highPeakHours.includes(currentHour)) {
      peakMultiplier = 1.8 + (Math.random() * 0.6); // 1.8-2.4x
    } else if (mediumPeakHours.includes(currentHour)) {
      peakMultiplier = 1.3 + (Math.random() * 0.4); // 1.3-1.7x
    } else if (lowPeakHours.includes(currentHour)) {
      peakMultiplier = 0.8 + (Math.random() * 0.4); // 0.8-1.2x
    } else {
      peakMultiplier = 0.5 + (Math.random() * 0.2); // 0.5-0.7x (valleys)
    }
    
    // Day phase effect (morning, afternoon, evening, night)
    const dayPhase = Math.floor(currentHour / 6); // 0,1,2,3
    const phaseEffect = [0.7, 1.0, 1.2, 0.85][dayPhase];
    
    // Complex progress calculation with multiple randomizing factors
    hourlyProgressPercent = ((currentHour - 8) / 15) * 
      peakMultiplier * 
      phaseEffect * 
      (0.7 + Math.random() * 0.6) * // Randomness factor (0.7-1.3)
      (Math.sin(currentHour / 3) + 1.5) / 2.5; // Sine wave pattern for natural-looking curves
  } else {
    // Night hours (0h-8h) - more chaotic with occasional night surges
    const nightFactor = Math.random() < 0.15 ? (2.0 + Math.random()) : 
                        Math.random() < 0.4 ? (1.3 + Math.random() * 0.4) : 
                        (0.4 + Math.random() * 0.4); // Three-tiered night pattern
    
    // More chaotic calculation for night hours
    hourlyProgressPercent = ((currentHour + 24 - 8) % 24) / 24 * 0.3 * nightFactor *
      (0.5 + Math.random() * 1.0); // Even more randomness at night (0.5-1.5)
  }
  
  // Add random "bursts" of activity with higher probability and variance
  // Multiple tiers of bursts with different probabilities
  let burstBonus = 0;
  const burstRoll = Math.random();
  if (burstRoll < 0.02) { // 2% chance of major burst
    burstBonus = 0.15 + Math.random() * 0.25; // 15-40% bonus
  } else if (burstRoll < 0.08) { // 6% chance of medium burst
    burstBonus = 0.08 + Math.random() * 0.12; // 8-20% bonus
  } else if (burstRoll < 0.20) { // 12% chance of minor burst
    burstBonus = 0.03 + Math.random() * 0.07; // 3-10% bonus
  }
  
  // Total percentage with significantly more variation
  const totalPercentage = basePercentage + hourlyProgressPercent + burstBonus;
  
  // Random market conditions with wider swing (-8% to +12%)
  const marketConditions = 0.92 + (Math.random() * 0.20);
  
  // Secondary market condition factor (industry-specific impacts)
  const secondaryMarketFactor = 0.90 + (Math.random() * 0.20); // 0.90-1.10
  
  // Calculate initial values with complex market influences
  let calculatedAds = Math.floor(dailyAdsTarget * totalPercentage * marketConditions * secondaryMarketFactor);
  let calculatedRevenue = Math.floor(dailyRevenueTarget * totalPercentage * marketConditions * 
    // Revenue has its own independent multiplier to create natural divergence between ads and revenue
    (0.85 + Math.random() * 0.30));
  
  // Add significant random fluctuations to completely break predictability
  calculatedAds = Math.floor(calculatedAds * (0.75 + Math.random() * 0.50)); // 75-125% variation
  calculatedRevenue = Math.floor(calculatedRevenue * (0.70 + Math.random() * 0.60)); // 70-130% variation
  
  // Occasional extreme outliers (both high and low)
  if (Math.random() < 0.03) { // 3% chance of extreme outlier
    if (Math.random() < 0.5) {
      // High outlier
      calculatedAds = Math.floor(calculatedAds * (1.3 + Math.random() * 0.7)); // 130-200% boost
      calculatedRevenue = Math.floor(calculatedRevenue * (1.4 + Math.random() * 0.8)); // 140-220% boost
    } else {
      // Low outlier
      calculatedAds = Math.floor(calculatedAds * (0.4 + Math.random() * 0.3)); // 40-70% reduction
      calculatedRevenue = Math.floor(calculatedRevenue * (0.3 + Math.random() * 0.4)); // 30-70% reduction
    }
  }
  
  // Use the larger of calculated or minimum values
  const initialAds = Math.max(minBaseAds, calculatedAds);
  const initialRevenue = Math.max(minBaseRevenue, calculatedRevenue);
  
  return { initialAds, initialRevenue };
};
