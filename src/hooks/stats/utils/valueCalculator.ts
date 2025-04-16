
export const calculateInitialValues = (dailyAdsTarget: number, dailyRevenueTarget: number) => {
  // Get current hour (0-23)
  const currentHour = new Date().getHours();
  
  // Generate truly realistic base values with natural variation (much smaller values at start)
  const minBaseAds = 5000 + Math.floor(Math.random() * 8000); // 5,000-13,000 base
  const minBaseRevenue = 8000 + Math.floor(Math.random() * 12000); // 8,000-20,000 base
  
  // Use smaller but more realistic base percentage (0.5% to 1.5%)
  // Creates a slow organic growth rather than large jumps
  const basePercentage = 0.005 + (Math.random() * 0.01);
  
  // Add realistic time-based progression
  let hourlyProgressPercent = 0;
  
  // Day phases with realistic business hours patterns
  if (currentHour >= 8 && currentHour <= 23) {
    // Active hours (8AM-11PM) with natural progression
    // Morning ramp-up, midday peak, afternoon stable, evening decline
    if (currentHour >= 8 && currentHour < 10) {
      // Morning ramp-up (8-10AM): gradual start of 0.3-0.7%
      hourlyProgressPercent = 0.003 + (0.004 * (currentHour - 8)) + (Math.random() * 0.003);
    } else if (currentHour >= 10 && currentHour < 14) {
      // Midday peak (10AM-2PM): 0.8-1.3%
      hourlyProgressPercent = 0.008 + (0.001 * (currentHour - 10)) + (Math.random() * 0.005);
    } else if (currentHour >= 14 && currentHour < 19) {
      // Afternoon stable (2-7PM): 0.7-1.1%
      hourlyProgressPercent = 0.007 + (0.0005 * (currentHour - 14)) + (Math.random() * 0.004);
    } else if (currentHour >= 19 && currentHour < 23) {
      // Evening decline (7-11PM): 0.6-0.3%
      hourlyProgressPercent = 0.006 - (0.001 * (currentHour - 19)) + (Math.random() * 0.003);
    } else {
      // Late night (11PM): 0.2-0.4%
      hourlyProgressPercent = 0.002 + (Math.random() * 0.002);
    }
    
    // Small day of week effect
    const dayOfWeek = new Date().getDay(); // 0-6 (Sunday-Saturday)
    let dayFactor = 1.0;
    
    // Weekend vs weekday effect
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      dayFactor = 0.8 + Math.random() * 0.2; // 80-100% of weekday (slower on weekends)
    } else if (dayOfWeek === 3 || dayOfWeek === 4) { // Wednesday-Thursday
      dayFactor = 1.05 + Math.random() * 0.15; // 105-120% (midweek peak)
    }
    
    hourlyProgressPercent *= dayFactor;
  } else {
    // Night hours (0h-8h) - minimal activity
    // Very small overnight activity (0.05-0.2%)
    hourlyProgressPercent = 0.0005 + (Math.random() * 0.0015);
  }
  
  // Add occasional small organic "bursts" (like a promoted post or campaign)
  // Using much smaller and less frequent bursts
  let burstBonus = 0;
  const burstRoll = Math.random();
  if (burstRoll < 0.03) { // 3% chance of minor burst
    burstBonus = 0.001 + Math.random() * 0.002; // 0.1-0.3% bonus (very small)
  } else if (burstRoll < 0.01) { // 1% chance of slightly larger burst
    burstBonus = 0.003 + Math.random() * 0.002; // 0.3-0.5% bonus (still small)
  }
  
  // Total percentage with more reasonable progression
  const totalPercentage = basePercentage + hourlyProgressPercent + burstBonus;
  
  // Small market fluctuation factor (98-102%)
  const marketConditions = 0.98 + (Math.random() * 0.04);
  
  // Calculate initial values with more realistic ranges
  let calculatedAds = Math.floor(dailyAdsTarget * totalPercentage * marketConditions);
  let calculatedRevenue = Math.floor(dailyRevenueTarget * totalPercentage * marketConditions * 
    // Minor variation between ads and revenue
    (0.97 + Math.random() * 0.06)); // 97-103% variation
  
  // Use the larger of calculated or minimum values
  const initialAds = Math.max(minBaseAds, calculatedAds);
  const initialRevenue = Math.max(minBaseRevenue, calculatedRevenue);
  
  return { initialAds, initialRevenue };
};
