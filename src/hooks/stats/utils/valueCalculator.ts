
export const calculateInitialValues = (dailyAdsTarget: number, dailyRevenueTarget: number) => {
  // Get current hour (0-23)
  const currentHour = new Date().getHours();
  
  // Guaranteed minimum initial values
  const minBaseAds = 150 + Math.floor(Math.random() * 150);
  const minBaseRevenue = 200 + Math.floor(Math.random() * 200);
  
  // Initial base (between 18% and 25% of daily target)
  const basePercentage = 0.18 + (Math.random() * 0.07);
  
  // Add progression based on hour (up to 35% additional)
  let hourlyProgressPercent = 0;
  
  if (currentHour >= 8 && currentHour <= 23) {
    // During the day (8h-23h), faster progression
    hourlyProgressPercent = (currentHour - 8) / 15 * 0.35;
  } else if (currentHour >= 0 && currentHour < 8) {
    // During the night (0h-8h), slower progression
    hourlyProgressPercent = ((currentHour + 24 - 8) % 24) / 24 * 0.15;
  }
  
  // Total percentage (between 18% and 60% depending on time)
  const totalPercentage = basePercentage + hourlyProgressPercent;
  
  // Random variation for realistic values (±2%)
  const finalPercentage = Math.min(0.60, totalPercentage + (Math.random() * 0.04 - 0.02));
  
  // Calculate initial values based on percentage, but with a guaranteed minimum
  const calculatedAds = Math.floor(dailyAdsTarget * finalPercentage);
  const calculatedRevenue = Math.floor(dailyRevenueTarget * finalPercentage);
  
  // Use the larger of the two values: calculated or guaranteed minimum
  const initialAds = Math.max(minBaseAds, calculatedAds);
  
  // Revenue is not exactly proportional to ads (slight variation)
  const revenueVariance = 0.97 + (Math.random() * 0.06); // 97% to 103%
  const calculatedRevenueWithVariance = Math.floor(calculatedRevenue * revenueVariance);
  const initialRevenue = Math.max(minBaseRevenue, calculatedRevenueWithVariance);
  
  return { initialAds, initialRevenue };
};
