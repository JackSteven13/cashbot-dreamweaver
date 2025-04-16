
export const adValueCategories = {
  premium: { min: 2.20, max: 3.60 },    // Premium ads
  high: { min: 1.10, max: 2.20 },       // High-value ads
  medium: { min: 0.70, max: 1.10 },     // Medium-value ads
  standard: { min: 0.45, max: 0.70 }    // Standard ads
};

export const adProcessingTime = {
  premium: { min: 250, max: 400 },     // Longer due to deep analysis
  high: { min: 180, max: 280 },
  medium: { min: 120, max: 220 },
  standard: { min: 80, max: 150 }      // Faster as less complex
};
