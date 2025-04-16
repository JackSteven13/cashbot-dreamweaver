
export const calculateInitialValues = (dailyAdsTarget: number, dailyRevenueTarget: number) => {
  // Valeurs de base plus cohérentes et raisonnables
  const minBaseAds = 12000 + Math.floor(Math.random() * 3000); // 12,000-15,000
  const minBaseRevenue = 15000 + Math.floor(Math.random() * 5000); // 15,000-20,000
  
  // Multiplicateurs réduits pour une croissance plus progressive
  const baseAdsMultiplier = 0.005 + (Math.random() * 0.002); // 0.5-0.7%
  const baseRevenueMultiplier = 0.006 + (Math.random() * 0.002); // 0.6-0.8%
  
  // Calculer les valeurs initiales avec une petite variation aléatoire
  const initialAds = Math.floor(minBaseAds * (1 + baseAdsMultiplier));
  const initialRevenue = Math.floor(minBaseRevenue * (1 + baseRevenueMultiplier));
  
  return { initialAds, initialRevenue };
};
