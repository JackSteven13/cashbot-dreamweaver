
export const calculateInitialValues = (dailyAdsTarget: number, dailyRevenueTarget: number) => {
  // Get current hour (0-23)
  const currentHour = new Date().getHours();
  
  // Generate more realistic base values with greater variation
  const minBaseAds = 150 + Math.floor(Math.random() * 350); // Increased variation
  const minBaseRevenue = 200 + Math.floor(Math.random() * 400); // Increased variation
  
  // Dynamic base percentage (between 12% and 28% - wider range)
  const basePercentage = 0.12 + (Math.random() * 0.16);
  
  // Add non-linear progression based on hour
  let hourlyProgressPercent = 0;
  
  if (currentHour >= 8 && currentHour <= 23) {
    // During active hours (8h-23h), more dynamic progression
    const peakHours = [10, 11, 14, 15, 16, 20, 21]; // High activity hours
    const isHighActivity = peakHours.includes(currentHour);
    
    hourlyProgressPercent = ((currentHour - 8) / 15) * 
      (isHighActivity ? 0.45 : 0.25) * // Higher variation during peak hours
      (0.85 + Math.random() * 0.3); // Add randomness
  } else {
    // Night hours (0h-8h), slower but still variable progression
    const nightFactor = Math.random() < 0.3 ? 1.5 : 1; // Occasional night boosts
    hourlyProgressPercent = ((currentHour + 24 - 8) % 24) / 24 * 0.2 * nightFactor;
  }
  
  // Add random "bursts" of activity (5% chance)
  const burstBonus = Math.random() < 0.05 ? (0.1 + Math.random() * 0.15) : 0;
  
  // Total percentage with more variation
  const totalPercentage = basePercentage + hourlyProgressPercent + burstBonus;
  
  // Random market conditions (-3% to +3%)
  const marketConditions = 0.97 + (Math.random() * 0.06);
  
  // Calculate initial values with market influence
  let calculatedAds = Math.floor(dailyAdsTarget * totalPercentage * marketConditions);
  let calculatedRevenue = Math.floor(dailyRevenueTarget * totalPercentage * marketConditions);
  
  // Add minor random fluctuations to break predictability
  calculatedAds = Math.floor(calculatedAds * (0.95 + Math.random() * 0.1));
  calculatedRevenue = Math.floor(calculatedRevenue * (0.95 + Math.random() * 0.1));
  
  // Use the larger of calculated or minimum values
  const initialAds = Math.max(minBaseAds, calculatedAds);
  const initialRevenue = Math.max(minBaseRevenue, calculatedRevenue);
  
  return { initialAds, initialRevenue };
};
