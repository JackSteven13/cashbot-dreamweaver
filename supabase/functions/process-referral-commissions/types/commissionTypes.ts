
/**
 * Interface pour les résultats du traitement des commissions
 */
export interface CommissionProcessingResult {
  success: boolean;
  message: string;
  processed?: number;
  errors?: number;
  failedIds?: string[];
}

/**
 * Interface pour les taux de commission par niveau
 */
export interface CommissionRates {
  direct: number;    // Commission directe (niveau 1)
  recurring?: number; // Commission récurrente
  level2?: number;   // Commission de niveau 2 (filleuls des filleuls)
}

/**
 * Interface pour les données de calcul de commission
 */
export interface CommissionCalculationData {
  amount: number;
  subscription: string;
  referrerId: string;
  referrerSubscription: string;
  transactionId: string;
  isRecurring?: boolean;
}
