
export interface AdTypeDistribution {
  premium: number;
  high: number;
  medium: number;
  standard: number;
}

export interface LocationData {
  country: string;
  efficiency: number;
  weight: number;
  botCount: number;
  adTypes: AdTypeDistribution;
}

export const activeLocations: LocationData[] = [
  { country: "États-Unis", efficiency: 0.95, weight: 1.8, botCount: 24, adTypes: { premium: 0.05, high: 0.15, medium: 0.30, standard: 0.50 } },
  { country: "Royaume-Uni", efficiency: 0.92, weight: 1.2, botCount: 16, adTypes: { premium: 0.03, high: 0.12, medium: 0.25, standard: 0.60 } },
  { country: "France", efficiency: 0.94, weight: 1.4, botCount: 18, adTypes: { premium: 0.04, high: 0.14, medium: 0.32, standard: 0.50 } },
  { country: "Allemagne", efficiency: 0.93, weight: 1.3, botCount: 17, adTypes: { premium: 0.04, high: 0.13, medium: 0.28, standard: 0.55 } },
  { country: "Italie", efficiency: 0.91, weight: 1.1, botCount: 14, adTypes: { premium: 0.03, high: 0.11, medium: 0.26, standard: 0.60 } },
  { country: "Espagne", efficiency: 0.90, weight: 1.0, botCount: 13, adTypes: { premium: 0.02, high: 0.10, medium: 0.28, standard: 0.60 } },
  { country: "Suède", efficiency: 0.92, weight: 0.9, botCount: 12, adTypes: { premium: 0.03, high: 0.12, medium: 0.30, standard: 0.55 } },
  { country: "Danemark", efficiency: 0.91, weight: 0.8, botCount: 10, adTypes: { premium: 0.03, high: 0.11, medium: 0.26, standard: 0.60 } },
  { country: "Canada", efficiency: 0.93, weight: 1.0, botCount: 13, adTypes: { premium: 0.04, high: 0.13, medium: 0.28, standard: 0.55 } },
  { country: "Australie", efficiency: 0.89, weight: 0.7, botCount: 9, adTypes: { premium: 0.02, high: 0.09, medium: 0.24, standard: 0.65 } },
  { country: "Japon", efficiency: 0.94, weight: 1.3, botCount: 17, adTypes: { premium: 0.05, high: 0.15, medium: 0.30, standard: 0.50 } },
  { country: "Pays-Bas", efficiency: 0.92, weight: 0.8, botCount: 10, adTypes: { premium: 0.03, high: 0.12, medium: 0.30, standard: 0.55 } },
  { country: "Belgique", efficiency: 0.91, weight: 0.7, botCount: 9, adTypes: { premium: 0.03, high: 0.11, medium: 0.28, standard: 0.58 } }
];

// Calculate total weight for proportional distribution
export const totalWeight = activeLocations.reduce((sum, location) => sum + location.weight, 0);

// Calculate total number of bots
export const totalBotCount = activeLocations.reduce((sum, location) => sum + location.botCount, 0);
