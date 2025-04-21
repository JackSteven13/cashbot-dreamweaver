
export const calculateInitialValues = (dailyAdsTarget: number, dailyRevenueTarget: number) => {
  // Valeurs de base réalistes
  const minBaseAds = 35000 + Math.floor(Math.random() * 5000); // 35,000-40,000
  const minBaseRevenue = 25000 + Math.floor(Math.random() * 3000); // 25,000-28,000
  
  // Multiplicateurs très réduits pour une croissance très lente
  const baseAdsMultiplier = 0.001 + (Math.random() * 0.001); // 0.1-0.2%
  const baseRevenueMultiplier = 0.001 + (Math.random() * 0.0015); // 0.1-0.25%
  
  // Calculer les valeurs initiales avec une petite variation aléatoire
  const initialAds = Math.floor(minBaseAds * (1 + baseAdsMultiplier));
  const initialRevenue = Math.floor(minBaseRevenue * (1 + baseRevenueMultiplier));
  
  return { initialAds, initialRevenue };
};
