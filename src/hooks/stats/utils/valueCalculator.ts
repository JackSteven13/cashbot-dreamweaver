
export const calculateInitialValues = (dailyAdsTarget: number, dailyRevenueTarget: number) => {
  // Valeurs de base plus élevées et cohérentes
  const minBaseAds = 35000 + Math.floor(Math.random() * 10000); // 35,000-45,000
  const minBaseRevenue = 42000 + Math.floor(Math.random() * 12000); // 42,000-54,000
  
  // Multiplicateurs réduits pour une croissance plus progressive
  const baseAdsMultiplier = 0.005 + (Math.random() * 0.002); // 0.5-0.7%
  const baseRevenueMultiplier = 0.006 + (Math.random() * 0.002); // 0.6-0.8%
  
  // Calculer les valeurs initiales avec une petite variation aléatoire
  const initialAds = Math.floor(minBaseAds * (1 + baseAdsMultiplier));
  const initialRevenue = Math.floor(minBaseRevenue * (1 + baseRevenueMultiplier));
  
  return { initialAds, initialRevenue };
};
