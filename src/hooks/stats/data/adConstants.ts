
export const adProcessingTime = {
  standard: { min: 12000, max: 18000 }, // 12-18 secondes par pub standard
  premium: { min: 20000, max: 30000 },  // 20-30 secondes pour pubs premium
  high: { min: 15000, max: 25000 },     // 15-25 secondes pour pubs haute qualité
  medium: { min: 13000, max: 20000 }    // 13-20 secondes pour pubs moyennes
};

export const adValueCategories = {
  standard: { min: 0.001, max: 0.003 }, // 0.1-0.3 centimes
  medium: { min: 0.002, max: 0.005 },   // 0.2-0.5 centimes
  high: { min: 0.004, max: 0.008 },     // 0.4-0.8 centimes
  premium: { min: 0.007, max: 0.015 }   // 0.7-1.5 centimes
};
